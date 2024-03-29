module.exports = function(config) {
	const files = "src/**/test/browser/*.ts*";
	config.set({
		basePath: "",
		frameworks: [ "browserify", "tap" ],
		files: [ files ],
		preprocessors: {
			[files]: [ "browserify" ]
		},
		browserify: {
			transform: [
				[ "brfs" ],
				[ "babelify", { presets: [ "airbnb" ] } ]
			],
			plugin: [
				[ "tsify" ]
			],
			configure: function(bundle) {
				bundle.on("prebundle", function() {
					bundle.require(require("ud/noop"), { expose: "ud" });
					bundle.require(require("chloride/browser"), { expose: "chloride" }) // only required for r2
					bundle.external("react/addons");
					bundle.external("react/lib/ReactContext");
					bundle.external("react/lib/ExecutionEnvironment");
				});
			}
		},
		reporters: ["tap-pretty"],
		tapReporter: {
			prettify: require("tap-diff"),
			separator: true
		},
		port: 9876,
		colors: true,
		logLevel: config.LOG_DEBUG,
		autoWatch: process.env.WATCH === "true",
		browsers: [ "jsdom" ],
		singleRun: !(process.env.WATCH === "true"),
		browserConsoleLogOptions: {
			level: "error",
			format: "%b %T: %m",
			terminal: false
		}
	});
}
