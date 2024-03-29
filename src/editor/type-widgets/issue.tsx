import {observer, inject} from "mobx-react";
import * as React from "react";

import {BaseEditWidget} from "../base-edit-widget";
import {makePropertyAccessor} from "../utils/accessor";
import {IIssue} from "../../lang/description";


@inject("editorState") @observer
export class Issue extends BaseEditWidget<IIssue> {

	renderContents(issue: IIssue) {
		return (
			<div>
				<span>{issue.message}</span>
				{issue.causedBy ? <Issue accessor={makePropertyAccessor(issue, "causedBy")} /> : null}
			</div>
		);
	}

}
