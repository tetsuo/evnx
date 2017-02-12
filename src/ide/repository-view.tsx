import {observer, inject} from "mobx-react";
import * as React from "react";

import {exampleRepository} from "./external-objects/example-repository";
import {EditorState} from "./editor/state";

const styles = require("./editor/styles.scss");

export type IRepositoryViewProps = {
	editorState?: EditorState
};

@inject("editorState") @observer
export class RepositoryView extends React.Component<IRepositoryViewProps, {}> {
	render() {
		const {editorState} = this.props;
		if (!editorState) {
			return null;
		}

		return (
			<div className={styles.resourcesPane}>
				<span>Resource:&nbsp;</span>
				<select
					className={styles.resourceSelector}
					ref="resourceSelector"
					value={editorState.pathLoaded || "none"}
					onChange={this.handleChange.bind(this)}
				>
					<option key="none" value="none" disabled={true}>(none)</option>
					{exampleRepository.resourcePaths().map(path => <option key={path} value={path}>{path}</option>)}
				</select>
			</div>
		);
	}

	handleChange() {
		const {editorState} = this.props;
		if (editorState) {
			const path = (this.refs as any).resourceSelector.value;
			editorState.setResource(path, exampleRepository.resourceByPath(path));
		}
	}

}
