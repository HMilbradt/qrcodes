import { Router } from 'itty-router';
import qrcode from 'qrcode'

const blockSize = 50

/**
 * @param {number} size The width and height of the SVG
 * @param {string[]} children Elements to add to the SVG
 */
function svg(size, children) {
	return `<svg version="1.1"
	width="${size}"
	height="${size}"
	xmlns="http://www.w3.org/2000/svg">
		${children.join('')}
</svg>`
}

const router = Router();

router.get('/', ({ query }) => {
	const dataToEncode = query.data
	const color = query.color ? `#${query.color}` : '#000000'

	const encodedData = qrcode.create(dataToEncode)
	const codeSize = encodedData.modules.size
	const codeData = encodedData.modules.data

	let blocks = []
	for (let i = 0; i < codeSize; i++) {
		for (let j = 0; j < codeSize; j++) {
			const rowOffset = i * codeSize
			const isDark = codeData[rowOffset + j]

			if (isDark) {
				const x = i * blockSize
				const y = j * blockSize

				const rect = `<rect x="${x}" y="${y}" width="${blockSize}" height="${blockSize}" fill="${color}"></rect>`
				blocks.push(rect)
			}
		}
	}

	const svgSize = codeSize * blockSize
	const response = svg(svgSize, blocks)

	return new Response(response, {
		headers: {
			'Content-Type': 'image/svg+xml'
		}
	});
});

router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
