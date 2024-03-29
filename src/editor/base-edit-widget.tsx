import * as React from "react";

import {IWithAccessor} from "./utils/accessor";
import {type} from "./utils/object-util";
import {TypeSelector} from "./type-selector";
import {EditorState, FocusType} from "./state";
import {preventBubbleUp} from "./utils/ui-util";

const styles = require("./styles.scss");

export type IBaseEditorWidgetProps = {
	editorState?: EditorState;
};

export abstract class BaseEditWidget<T> extends React.Component<IWithAccessor<T> & IBaseEditorWidgetProps, void> {
	abstract renderContents(value: T): void;

	render() {
		const value = this.props.accessor.value;
		return (
			<div onClick={this.handleFocusClick.bind(this)} className={this.genericClassName()}>
				{
					(this.isSelected() && !this.props.accessor.isUnswitchable)
						? <TypeSelector initialType={type(value)} onChange={newType => { console.log(newType); }} />
						: null
				}
				<span className={styles.editIcons}><button onClick={this.handleDeleteClick.bind(this)}>DEL</button></span>
				{this.renderContents(value)}
			</div>
		);
	}

	isSelected() {
		const {editorState} = this.props;
		if (!editorState) {
			return;
		}
		return editorState.itemFocused === this && editorState.focusType === FocusType.selected;
	}

	isBeingEdited() {
		const {editorState} = this.props;
		if (!editorState) {
			return;
		}
		return editorState.itemFocused === this && editorState.focusType === FocusType.editing;
	}

	exitEdit() {
		const {editorState} = this.props;
		if (!editorState) {
			return;
		}
		if (editorState.itemFocused === this) {
			editorState.itemFocused = FocusType.selected;
		}
	}


	/**
	 * @return an action that selects the given item.
	 * Intended to be used in React onClick defs as 'editorState.actionSelectItem(this)'.
	 */
	private handleFocusClick<E>(e: React.SyntheticEvent<E>) {
		const {editorState} = this.props;
		if (!editorState) {
			return;
		}
		if (editorState.itemFocused === this) {
			editorState.focusType = FocusType.editing;
		} else if (editorState.itemFocused !== FocusType.editing) {
			editorState.itemFocused = this;
			editorState.focusType = FocusType.selected;
		}
		preventBubbleUp(e);
	}

	private genericClassName() {
		const {editorState} = this.props;
		if (!editorState) {
			return;
		}
		return styles.widget + " " + ( editorState.itemFocused === this ? styles.focused : "" );
	}

	private handleDeleteClick<E>(e: React.SyntheticEvent<E>) {
		this.exitEdit();
		this.props.accessor.delete();
		preventBubbleUp(e);
	}

}

