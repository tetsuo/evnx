import * as React from "react";
import * as ReactDOM from "react-dom";

import {observer, Provider} from "mobx-react";
import {EditorState} from "./editor/state";
import {EditorView} from "./editor/view";
import {EvaluationView} from "./evaluation-view";

import {browser} from "./external-objects/browser";
import {exampleRepository} from "./external-objects/example-repository";
import {RepositoryView} from "./repository-view";

const editorState = new EditorState;

if (location.hash) {
	const path = browser.uriHash();
	if (path) {
		const resourceToLoad = exampleRepository.resourceByPath(path);
		if (resourceToLoad) {
			editorState.setResource(path, resourceToLoad);
		}
	}
}

@observer
class IDE extends React.Component<any, void> {
	render() {
		return (
				<Provider editorState={editorState}>
					<div>
						<RepositoryView />
						<hr />
						<EditorView />
						<EvaluationView />
					</div>
				</Provider>
		);
	}
}

class UpdateWrapper extends React.Component<void, void> {
	componentWillMount() {
		this.forceUpdate(); // a little hack to help us rerender when this module is reloaded
	}

	render() {
		return <IDE />;
	}
}

const ud = require("ud");

ReactDOM.render(
	React.createElement(ud.defn(module, UpdateWrapper)),
	document.getElementById("main")
);
