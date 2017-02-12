const isInteger = require("is-integer");
const indentString = require("indent-string");

export function tag(strings: any, ...keys: any[]) {
	return (function(...values: any[]) {
		const dict = values[values.length - 1] || {};
		const result = [strings[0]];

		keys.forEach((key, i) => {
			const value = isInteger(key) ? values[key] : dict[key];
			result.push(value, strings[i + 1]);
		});

		return result.join("");
	});
}

export function indent(s: string, n = 2, p = " ") {
	return indentString(String(s), n, p);
}

export function capitalize(s: string) {
	return s
		.replace(/-/g, " ")
		.replace(/\w\S*/g, res => {
			return res.charAt(0).toUpperCase() + res.substr(1).toLowerCase();
		})
		.replace(/[\s\xa0]+/g, "");
}
