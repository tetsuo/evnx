import {observer, inject} from "mobx-react";
import * as React from "react";

import {BaseEditWidget} from "../base-edit-widget";
import {IValueReference} from "../../description";


@inject("editorState") @observer
export class ValueReference extends BaseEditWidget<IValueReference> {

	renderContents(valueReference: IValueReference) {
		return (<span><em>{valueReference.name}</em></span>);
	}

}
