module.exports = [
	{
		"$sType": "comments",
		"text": "Calculation of Fibonacci numbers"
	},
	{
		"$sType": "function definition",
		"name": "fib",
		"parameters": {
			"n": "number"
		},
		"returnType": "number",
		"body": {
			"$sType": "if-then-else",
			"condition": {
				"$sType": "binary operation",
				"operator": "<",
				"left": {
					"$sType": "value reference",
					"name": "n"
				},
				"right": 2
			},
			"trueBranch": 1,
			"falseBranch": {
				"$sType": "binary operation",
				"operator": "+",
				"left": {
					"$sType": "function application",
					"function": {
						"$sType": "function reference",
						"name": "fib"
					},
					"arguments": {
						"n": {
							"$sType": "binary operation",
							"operator": "+",
							"left": {
								"$sType": "value reference",
								"name": "n"
							},
							"right": -1
						}
					}
				},
				"right": {
					"$sType": "function application",
					"function": {
						"$sType": "function reference",
						"name": "fib"
					},
					"arguments": {
						"n": {
							"$sType": "binary operation",
							"operator": "+",
							"left": {
								"$sType": "value reference",
								"name": "n"
							},
							"right": -2
						}
					}
				}
			}
		}
	},
	[
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 0
			}
		},
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 1
			}
		},
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 2
			}
		},
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 3
			}
		},
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 4
			}
		},
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 5
			}
		},
		{
			"$sType": "function application",
			"function": {
				"$sType": "function reference",
				"name": "fib"
			},
			"arguments": {
				"n": 6
			}
		}
	]
]
