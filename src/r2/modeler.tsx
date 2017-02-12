import * as React from "react"
import {inject, observer, Provider} from "mobx-react"
import {State} from "./state"
import {EditorView} from "../editor/view"

const styles = require("./modeler.scss")

export type IModelerProps = {
    state?: State
}

@inject("state") @observer
export class Modeler extends React.Component<IModelerProps, void> {
    render() {
        const {state} = this.props
        if (!state) {
            return null
        }

        const {editorStates, currentChannelId} = state

        const editorState = editorStates[currentChannelId]

        return <Provider editorState={editorState}>
            <div className={styles.modeler}>
                <EditorView />
            </div>
        </Provider>
    }
}
