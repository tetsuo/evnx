import {observer} from "mobx-react";
import * as React from "react";

import {editorState} from "../state";
import {dispatch} from "../dispatcher";


@observer
export class JsonProperty<T> extends React.Component<{ name: string; value: any; }, {}> {

	render() {
		const {name, value} = this.props;
		return (
			<div onClick={editorState.actionSelectItem(this)} className={editorState.cssClassForSelection(this)}>
				<span>{name}</span> <span>:</span> {dispatch(value)}
			</div>
		);
	}

}
