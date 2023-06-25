import { Router } from 'itty-router';
import qrcode from 'qrcode';

const blockSize = 50;

/**
 * Constructs and SVG document and embeds the provided children.
 *
 * @param {number} size The width and height of the SVG
 * @param {string[]} children Elements to add to the SVG
 * @returns {string} SVG document
 */
function svg(size, children) {
	return `<svg version="1.1"
	width="${size}"
	height="${size}"
	xmlns="http://www.w3.org/2000/svg">
		${children.join('')}
</svg>`;
}

const router = Router();

/**
 * Attempts to parse and sanitize provided input into a hex color.  Adds the #
 * if it's missing.
 * @param {string} color A possible hex color
 * @returns {string} A parsed hex color
 */
function parseColor(color) {
	const colorRegex = /^#?[a-fA-F0-9]{6}$/;
	if (!colorRegex.test(color)) {
		throw new Error("Invalid 'color' parameter, must be a valid 6 digit hex code.");
	}

	if (color[0] !== '#') {
		color = `#${color}`;
	}

	return color;
}

/**
 * Creates a payload for constructing QR codes.  Parameters will
 * be validated and sanitized.
 *
 * @param {any} query Query params
 * @returns Validated and sanitized payload
 */
function getPayload(query) {
	let payload = { ...query };

	if (!payload.data) {
		throw new Error("Missing required parameter 'data'.");
	}

	if (payload.color) {
		payload.color = parseColor(payload.color);
	} else {
		payload.color = '#000000';
	}

	return payload;
}

/**
 * Renders a QR code using the provided parameters, and renders it to a SVG document.
 *
 * @param {any} payload QR code params
 * @returns {string} QR code as SVG
 */
function renderQrCode(payload) {
	const dataToEncode = payload.data;
	const color = payload.color;

	const encodedData = qrcode.create(dataToEncode);
	const codeSize = encodedData.modules.size;
	const codeData = encodedData.modules.data;

	let blocks = [];
	for (let i = 0; i < codeSize; i++) {
		for (let j = 0; j < codeSize; j++) {
			const rowOffset = i * codeSize;
			const isDark = codeData[rowOffset + j];

			if (isDark) {
				const x = i * blockSize;
				const y = j * blockSize;

				let shape;
				switch (payload.shape) {
					case 'circle':
						shape = `<circle cx="${x + blockSize / 2}" cy="${y + blockSize / 2}" r="${blockSize / 2}" fill="${color}"></circle>`
						break;
					case 'diamond':
						shape = `<polygon points="${x + blockSize / 2},${y} ${x + blockSize},${y + blockSize / 2} ${x + blockSize / 2},${y + blockSize} ${x},${y + blockSize / 2}" fill="${color}"></polygon>`;
						break;
					case 'square':
					default:
						shape = `<rect x="${x}" y="${y}" width="${blockSize}" height="${blockSize}" fill="${color}"></rect>`
						break;
				}

				blocks.push(shape)
			}
		}
	}

	const svgSize = codeSize * blockSize;
	const response = svg(svgSize, blocks);

	return response;
}

router.get('/', ({ query }) => {
	let payload;
	try {
		payload = getPayload(query);
	} catch (error) {
		return new Response(JSON.stringify({ message: error.message }), {
			status: 400,
			statusText: 'Not Found',
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const response = renderQrCode(payload);

	return new Response(response, {
		headers: {
			'Content-Type': 'image/svg+xml',
		},
	});
});

router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
