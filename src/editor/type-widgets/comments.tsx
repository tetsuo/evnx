import {observer, inject} from "mobx-react";
import * as React from "react";

import {IComments} from "../../lang/description";
import {BaseEditWidget} from "../base-edit-widget";

const styles = require("../styles.scss");


@inject("editorState") @observer
export class Comments extends BaseEditWidget<IComments> {

	renderContents(comments: IComments) {
		return (
			<p className={styles.comments}>{comments.text}</p>
		);
	}

}
