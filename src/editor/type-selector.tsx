import {observer} from "mobx-react";
import * as React from "react";

import {preventBubbleUp} from "./utils/ui-util";

import {default as metaModelInstance} from "./instance"; // TODO: nope
const sTypes = metaModelInstance.sTypes();

const styles = require("./styles.scss");


export interface ITypeSelectorProps {
	initialType: string;
	onChange: (newType: string) => void;
}


@observer
export class TypeSelector extends React.Component<ITypeSelectorProps, void> {

	render() {
		return (
			<select
				ref="typeSelector"
				className={styles.editIcons}
				value={this.props.initialType}
				onClick={preventBubbleUp}
				onChange={this.onChange.bind(this)}
			>
				<option value="json-array" key="json-array">array: []</option>,
				<option value="json-object" key="json-object">object: {"{}"}</option>,
				<option value="json-simple-value" key="json-simple-value">simple value: ...</option>
				{sTypes.map((sType: any) => <option value={sType} key={sType}>{sType}</option>)}
			</select>
		);
	}

	private onChange() {
		this.props.onChange((this.refs as any).typeSelector.value as string);
	}

}

