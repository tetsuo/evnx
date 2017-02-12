import {observer, inject} from "mobx-react";
import * as React from "react";

import {dispatch} from "./dispatcher";
import {EditorState} from "./state";

const styles = require("./styles.scss");

export type IEditorViewProps = {
	editorState?: EditorState
};

@inject("editorState") @observer
export class EditorView extends React.Component<IEditorViewProps, {}> {

	render() {
		const {editorState} = this.props;
		if (!editorState) {
			return null;
		}

		const {jsonData} = editorState;
		return (
			<div className={styles.editorPane}>
				<span>Program:</span>
				{dispatch(
					{
						value: jsonData,
						set: newValue => { editorState.jsonData = newValue; },
						"delete": () => { /* do nothing */ }
					},
					undefined
				)}
			</div>
		);
	}

}
