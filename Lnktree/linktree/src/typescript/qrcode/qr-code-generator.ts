/**
 * QR code generator — data-driven from src/data/qrcodes.json.
 *
 * Uses `qr-code-styling` (browser-first lib) inside a JSDOM polyfill, asks it
 * for SVG output, then rasterizes to PNG via sharp. SVG path avoids the
 * native `canvas` build (heavy on Termux/Android).
 *
 * Run from the linktree project root:
 *   npx tsx src/typescript/qrcode/qr-code-generator.ts                # all
 *   npx tsx src/typescript/qrcode/qr-code-generator.ts --only=<id>    # one
 *   npx tsx src/typescript/qrcode/qr-code-generator.ts --manifest=... # custom
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

// JSDOM polyfills must land on `globalThis` BEFORE qr-code-styling is
// imported (its module-level code touches `document` / `XMLSerializer`).
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(globalThis as unknown as { window: object }).window = dom.window;
(globalThis as unknown as { document: object }).document = dom.window.document;
(globalThis as unknown as { XMLSerializer: object }).XMLSerializer =
    dom.window.XMLSerializer;
(globalThis as unknown as { Node: object }).Node = dom.window.Node;
(globalThis as unknown as { HTMLElement: object }).HTMLElement =
    dom.window.HTMLElement;

// Node-specific entry — the default export from the package root is a
// browser-only build that touches `window` at import time without the
// guards the common bundle has. The CJS export is a named `QRCodeStyling`,
// not `default`.
const { QRCodeStyling } = (await import(
    'qr-code-styling/lib/qr-code-styling.common.js'
)) as unknown as { QRCodeStyling: typeof import('qr-code-styling').default };

type QrSource =
    | { type: 'url'; value?: string; ref?: string }
    | { type: 'vcard'; includePhoto?: boolean };

interface ContactAddress {
    type?: string;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
}

/**
 * vCard URL entry: either an inline {type,value} pair or a {ref} into the
 * top-level `links` map. Refs are preferred so a URL lives in exactly one
 * place and propagates to every vCard + QR that uses it.
 */
type ContactUrl =
    | { type: string; value: string }
    | { ref: string };

interface LinkEntry {
    type: string;
    value: string;
}

interface Contact {
    given: string;
    family: string;
    displayName?: string;
    email?: string;
    emailType?: string;
    tel?: string;
    telType?: string;
    address?: ContactAddress;
    urls?: ContactUrl[];
    birthday?: string;
    photoFile?: string;
}

interface VcfFile {
    id: string;
    output: string;
    includePhoto?: boolean;
}

// Loose typing — qr-code-styling's options surface is large and we just
// shallow-merge entries on top of defaults.
type StyleOptions = Record<string, unknown>;

interface QrSpec {
    id: string;
    category?: string;
    title?: string;
    description?: string;
    output: string;
    source: QrSource;
    style?: StyleOptions;
}

interface ManifestDefaults {
    outputDir?: string;
    size?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    style?: StyleOptions;
    styleByCategory?: Record<string, StyleOptions>;
}

interface PageMeta {
    title?: string;
    subtitle?: string;
    publicDir?: string;
    backHref?: string;
    backText?: string;
}

interface HtmlOutputCfg {
    output?: string;
    template?: string;
}

interface Manifest {
    page?: PageMeta;
    links?: Record<string, LinkEntry>;
    contact?: Contact;
    vcfFiles?: VcfFile[];
    defaults?: ManifestDefaults;
    qrcodes: QrSpec[];
    htmlOutput?: HtmlOutputCfg;
}

const PROJECT_ROOT = process.cwd();

function resolveContactUrl(
    u: ContactUrl,
    links: Record<string, LinkEntry> | undefined,
): LinkEntry {
    if ('ref' in u) {
        const e = links?.[u.ref];
        if (!e)
            throw new Error(
                `contact.urls references unknown link id: "${u.ref}" (not in manifest.links)`,
            );
        return e;
    }
    return u;
}

/**
 * Render a vCard 3.0 text document from the contact data block. Optionally
 * embeds the photo at `contact.photoFile` as a base64 JPEG (folded at 75
 * chars with leading-space continuation lines, per the spec).
 */
async function renderVcard(
    contact: Contact,
    includePhoto: boolean,
    links: Record<string, LinkEntry> | undefined,
): Promise<string> {
    const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
    lines.push(`N:${contact.family};${contact.given};`);
    lines.push(`FN:${contact.displayName ?? `${contact.given} ${contact.family}`}`);
    if (contact.email !== undefined) {
        // Uppercase TYPE values — Samsung Contacts only matches them
        // case-sensitively (HOME/WORK/PERSONAL etc.). iOS is lenient.
        const t = (contact.emailType ?? 'personal').toUpperCase();
        lines.push(`EMAIL;TYPE=${t}:${contact.email}`);
    }
    if (contact.tel !== undefined && contact.tel !== '') {
        const t = (contact.telType ?? 'mobile').toUpperCase();
        lines.push(`TEL;TYPE=${t}:${contact.tel}`);
    }
    if (contact.address) {
        const a = contact.address;
        // ADR needs an explicit TYPE= for Apple/Samsung Contacts to
        // display it. TYPE values are case-insensitive per RFC 2426
        // §4.1 but Samsung Contacts treats them case-sensitively and
        // only recognises UPPERCASE (HOME / WORK). Force uppercase so
        // both iOS and Samsung accept the field.
        const t = (a.type ?? 'home').toUpperCase();
        // NOTE: CHARSET= is vCard 2.1 syntax; RFC 2426 (vCard 3.0) does
        // NOT define it. UTF-8 is the implicit encoding. Emitting a
        // CHARSET parameter on a 3.0 property makes strict parsers
        // (notably Samsung's) reject the whole property — exactly the
        // ADR-drop symptom. The bytes themselves are UTF-8; that's
        // sufficient.
        lines.push(
            `ADR;TYPE=${t}:;;${a.street ?? ''};${a.city ?? ''};${a.region ?? ''};${a.postalCode ?? ''};${a.country ?? ''}`,
        );
    }
    for (const u of contact.urls ?? []) {
        const resolved = resolveContactUrl(u, links);
        lines.push(`URL;TYPE=${resolved.type}:${resolved.value}`);
    }
    if (contact.birthday) lines.push(`BDAY:${contact.birthday}`);

    if (includePhoto) {
        if (!contact.photoFile)
            throw new Error('includePhoto=true but contact.photoFile is unset');
        const absPath = path.resolve(PROJECT_ROOT, contact.photoFile);
        const jpegBuf = await readFile(absPath);
        const b64 = jpegBuf.toString('base64');
        const wrapped = (b64.match(/.{1,75}/g) ?? []).join('\n ');
        lines.push('');
        lines.push(`PHOTO;ENCODING=BASE64;JPEG:${wrapped}`);
        lines.push('');
    }
    lines.push('END:VCARD');
    // vCard 3.0 (RFC 2426 §3.1) calls for CRLF line endings. Apple's
    // file-import parser tolerates LF; Apple's QR-vCard parser is
    // stricter and can drop fields when the line break isn't CRLF.
    return lines.join('\r\n');
}

function escapeHtmlText(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeHtmlAttr(s: string): string {
    return escapeHtmlText(s).replace(/"/g, '&quot;');
}

/**
 * Build qrcode.html by reading the template and substituting {{placeholders}}.
 *
 * The page is runtime-data-driven: JS in the template fetches qrcodes.json
 * and renders cards / wires the ?vcard=<id> download. The only thing we
 * bake at generate-time is the <head><title> (so the browser tab shows the
 * right name before JS runs), pulled from manifest.page.
 */
async function emitHtml(
    manifest: Manifest,
    cfg: HtmlOutputCfg,
): Promise<void> {
    const templatePath = path.resolve(
        PROJECT_ROOT,
        cfg.template ?? 'src/typescript/qrcode/qrcode.template.html',
    );
    const outputPath = path.resolve(
        PROJECT_ROOT,
        cfg.output ?? 'src/qrcode.html',
    );

    const template = await readFile(templatePath, 'utf-8');
    const page = manifest.page ?? {};

    const subs: Record<string, string> = {
        title: escapeHtmlText(page.title ?? ''),
        subtitle: escapeHtmlText(page.subtitle ?? ''),
    };

    const out = template.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
        if (!(k in subs))
            throw new Error(
                `qrcode template references unknown placeholder: {{${k}}}`,
            );
        return subs[k]!;
    });

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, out);
    console.log(
        `[html] ${path.relative(PROJECT_ROOT, outputPath)} (${Buffer.byteLength(out, 'utf-8')} B, runtime-data-driven)`,
    );
}

async function emitVcfFiles(
    contact: Contact,
    vcfFiles: VcfFile[],
    links: Record<string, LinkEntry> | undefined,
): Promise<void> {
    for (const v of vcfFiles) {
        const out = path.resolve(PROJECT_ROOT, v.output);
        await mkdir(path.dirname(out), { recursive: true });
        const text = await renderVcard(contact, !!v.includePhoto, links);
        await writeFile(out, text);
        console.log(
            `[vcf:${v.id}] ${path.relative(PROJECT_ROOT, out)} (${Buffer.byteLength(text, 'utf-8')} B${v.includePhoto ? ', with photo' : ''})`,
        );
    }
}

async function resolvePayload(
    spec: QrSpec,
    contact: Contact | undefined,
    links: Record<string, LinkEntry> | undefined,
): Promise<string> {
    if (spec.source.type === 'url') {
        if (spec.source.ref) {
            const entry = links?.[spec.source.ref];
            if (!entry)
                throw new Error(
                    `[${spec.id}] source.ref="${spec.source.ref}" not in manifest.links`,
                );
            return entry.value;
        }
        if (spec.source.value) return spec.source.value;
        throw new Error(
            `[${spec.id}] url source needs either 'value' or 'ref'`,
        );
    }
    if (spec.source.type === 'vcard') {
        if (!contact)
            throw new Error(
                `[${spec.id}] source.type='vcard' but manifest has no 'contact' block`,
            );
        return await renderVcard(contact, !!spec.source.includePhoto, links);
    }
    throw new Error(
        `[${spec.id}] unsupported source.type: ${(spec.source as { type: string }).type}`,
    );
}

/**
 * Shallow-merge per-entry style on top of defaults. Sub-objects (dotsOptions,
 * cornersSquareOptions, etc.) themselves merge one level deep — enough for
 * any per-entry tweak we'd realistically write.
 */
function mergeStyle(
    base: StyleOptions = {},
    override: StyleOptions = {},
): StyleOptions {
    const out: StyleOptions = { ...base };
    for (const [k, v] of Object.entries(override)) {
        if (
            v &&
            typeof v === 'object' &&
            !Array.isArray(v) &&
            base[k] &&
            typeof base[k] === 'object'
        ) {
            out[k] = {
                ...(base[k] as Record<string, unknown>),
                ...(v as Record<string, unknown>),
            };
        } else {
            out[k] = v;
        }
    }
    return out;
}

interface ImageOptions {
    imageSize?: number;
    margin?: number;
    hideBackgroundDots?: boolean;
}

/**
 * Pop the `image` + `imageOptions` keys off a style object so we can pass
 * the rest to qr-code-styling (whose JSDOM image embedding hangs on data
 * URIs — we composite the image ourselves with sharp after rendering).
 */
function extractImageConfig(style: StyleOptions): {
    style: StyleOptions;
    image?: string;
    imageOptions: ImageOptions;
} {
    const {
        image,
        imageOptions = {},
        ...rest
    } = style as StyleOptions & {
        image?: string;
        imageOptions?: ImageOptions;
    };
    return { style: rest, image, imageOptions };
}

/**
 * Composite a square brand image onto the center of the rendered QR PNG.
 *
 * `imageSize` is a 0..1 fraction of the QR width that the image+padding box
 * should occupy. `margin` is the padding (in QR pixels) of the white plate
 * around the image — analog to qr-code-styling's imageOptions.margin.
 */
async function compositeCenterImage(
    qrPng: Buffer,
    imagePathAbs: string,
    imageOptions: ImageOptions,
): Promise<Buffer> {
    const base = sharp(qrPng);
    const { width: qrW = 0, height: qrH = 0 } = await base.metadata();
    const ratio = Math.min(Math.max(imageOptions.imageSize ?? 0.32, 0.1), 0.5);
    const plateSize = Math.floor(Math.min(qrW, qrH) * ratio);
    const pad = imageOptions.margin ?? 6;
    const imgSize = Math.max(plateSize - pad * 2, 16);

    const logoPng = await sharp(imagePathAbs)
        .resize(imgSize, imgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    const plate = await sharp({
        create: {
            width: plateSize,
            height: plateSize,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    })
        .composite([
            { input: logoPng, gravity: 'center' },
        ])
        .png()
        .toBuffer();

    const left = Math.floor((qrW - plateSize) / 2);
    const top = Math.floor((qrH - plateSize) / 2);

    return await base.composite([{ input: plate, left, top }]).png().toBuffer();
}

async function generateOne(
    spec: QrSpec,
    defaults: ManifestDefaults,
    contact: Contact | undefined,
    links: Record<string, LinkEntry> | undefined,
): Promise<void> {
    const payload = await resolvePayload(spec, contact, links);

    const size = defaults.size ?? 800;
    const margin = defaults.margin ?? 4;
    const ecLevel = defaults.errorCorrectionLevel ?? 'H';

    // Merge chain: defaults.style → defaults.styleByCategory[category] → spec.style.
    // Lets a "category" tag (e.g., 'vcard', 'web', 'social') swap out the palette
    // without each entry re-stating the whole gradient.
    const categoryStyle =
        spec.category && defaults.styleByCategory
            ? defaults.styleByCategory[spec.category]
            : undefined;
    if (spec.category && !categoryStyle) {
        console.warn(
            `[${spec.id}] category "${spec.category}" not in defaults.styleByCategory`,
        );
    }
    const mergedStyle = mergeStyle(
        mergeStyle(defaults.style, categoryStyle),
        spec.style,
    );
    const { style: styleNoImage, image, imageOptions } =
        extractImageConfig(mergedStyle);

    const qr = new QRCodeStyling({
        width: size,
        height: size,
        margin,
        type: 'svg',
        data: payload,
        qrOptions: { errorCorrectionLevel: ecLevel },
        ...styleNoImage,
        jsdom: JSDOM,
        nodeCanvas: undefined,
    } as unknown as ConstructorParameters<typeof QRCodeStyling>[0]);

    const svgBuffer = await qr.getRawData('svg');
    if (!svgBuffer)
        throw new Error(`[${spec.id}] qr-code-styling returned empty SVG`);
    const svgString = Buffer.isBuffer(svgBuffer)
        ? svgBuffer.toString('utf-8')
        : await (svgBuffer as Blob).text();

    let pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();

    if (image) {
        const imgAbs = path.resolve(PROJECT_ROOT, image);
        pngBuffer = await compositeCenterImage(
            pngBuffer,
            imgAbs,
            imageOptions,
        );
    }

    const outputDir = defaults.outputDir ?? 'src/public';
    const outputPath = path.resolve(PROJECT_ROOT, outputDir, spec.output);

    await sharp(pngBuffer).toFile(outputPath);

    const meta = await sharp(outputPath).metadata();
    console.log(
        `[${spec.id}] ${spec.source.type.padEnd(3)} -> ${path.relative(PROJECT_ROOT, outputPath)} (${meta.width}x${meta.height})`,
    );
}

async function main(): Promise<number> {
    const { values } = parseArgs({
        options: {
            manifest: {
                type: 'string',
                default: 'src/typescript/qrcode/qrcodes.json',
            },
            only: { type: 'string' },
            help: { type: 'boolean', short: 'h' },
        },
    });

    if (values.help) {
        console.log(
            'Usage: qr-code-generator.ts [--manifest=PATH] [--only=ID]',
        );
        return 0;
    }

    const manifestPath = path.resolve(PROJECT_ROOT, values.manifest!);
    const manifest = JSON.parse(
        await readFile(manifestPath, 'utf-8'),
    ) as Manifest;
    const defaults = manifest.defaults ?? {};
    const contact = manifest.contact;
    const links = manifest.links;

    if (!values.only && manifest.contact && manifest.vcfFiles?.length) {
        await emitVcfFiles(manifest.contact, manifest.vcfFiles, links);
    }

    if (!values.only) {
        await emitHtml(manifest, manifest.htmlOutput ?? {});
    }

    const entries = values.only
        ? manifest.qrcodes.filter((q) => q.id === values.only)
        : manifest.qrcodes;

    if (entries.length === 0) {
        console.error(
            values.only
                ? `No QR with id "${values.only}" in ${values.manifest}`
                : `Manifest ${values.manifest} has no qrcodes`,
        );
        return 1;
    }

    let failed = 0;
    for (const spec of entries) {
        try {
            await generateOne(spec, defaults, contact, links);
        } catch (e) {
            failed++;
            console.error(
                `[${spec.id}] FAILED:`,
                e instanceof Error ? e.message : e,
            );
        }
    }

    console.log(
        `\n${entries.length - failed}/${entries.length} QR codes generated.`,
    );
    return failed === 0 ? 0 : 1;
}

process.exit(await main());
