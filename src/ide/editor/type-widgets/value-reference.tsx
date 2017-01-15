import {observer} from "mobx-react";
import * as React from "react";

import {BaseEditWidget} from "../base-edit-widget";
import {IValueReference} from "../../../latest";


@observer
export class ValueReference extends BaseEditWidget<IValueReference> {

	renderContents(valueReference: IValueReference) {
		return (<span><em>{valueReference.name}</em></span>);
	}

}
