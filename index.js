/**
 * entry
 */
function main() {
	logseq.App.showMsg('Plugin loaded :)');
	logseq.Editor.registerSlashCommand("Filter LaTeX Text",
		async () => {
			const block = await logseq.Editor.getCurrentBlock()

			logseq.Editor.updateBlock(block.uuid, applyFilter(block.content));
		}
	);
}

const REPLACE_RULES = [
	["⇐⇒", "\\Longleftrightarrow"],
	["· · ·", "\\dots"],
	["¨a", "ä"],
	["¨o", "ö"],
	["¨u", "ü"],
	["¨A", "Ä"],
	["¨O", "Ö"],
	["¨U", "Ü"],
	[/∈\s*([NZQR])/g, (_, dom) => `\\in \\mathbb{${dom}}`],

	["≡", "\\equiv "],
	["↔", "\\leftrightarrow "],
	["∧", "\\land "],
	["∨", "\\lor "],
	["¬", "\\neg "],
	["→", "\\rightarrow "],
	["⊤", "\\top "],
	["⊥", "\\perp "],
	["∈", "\\in "]
];

const GREEK_LETTERS =
{
	"ϕ": "\\varphi",
	"ψ": "\\psi",
	"χ": "\\chi",
	"λ": "\\lambda"
};

function applyFilter(text) {
	function insert(str, index, value) {
		return str.substr(0, index) + value + str.substr(index);
	}

	text = text.split("\n")[0];	// don't copy all the properties stuff

	// replace greek letters with optional index
	const GREEK_LETTERS_LIST = Object.keys(GREEK_LETTERS).join("");
	const INDICES_REGEX = new RegExp(String.raw`([${GREEK_LETTERS_LIST}])([0-9a-z])?`, "g");
	text = text.replaceAll(INDICES_REGEX, (match, greekletter, index) => {
		return GREEK_LETTERS[greekletter] + (index ? ("_" + index) : "");
	});

	// miscellaneous replacement rules
	for (const rule of REPLACE_RULES) {
		text = text.replaceAll(rule[0], rule[1]);
	}

	// try to find sections of math mode (it's easier to try and match the text surrounding math symbols starting with backslashes)
	const NONMATH_REGEX = /\s*\b(?<!\\)([\p{L}\s,.:]{2,})+\b\s*|^|$/giu;
	const boundaries = Array.from(text.matchAll(NONMATH_REGEX))
		.map(e => [e.index, e.index + e[0].length])
		.flat().slice(1, -1).reverse();	// gets all boundaries between math and regular text

	for (bound of boundaries) {	// iterate backwards (to preserve indexing) and add the '$' character
		text = insert(text, bound, '$');
	}

	return text;
}

// bootstrap
logseq.ready(main).catch(console.error);
