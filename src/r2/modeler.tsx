import * as React from "react"
import {inject, observer} from "mobx-react"
import {State} from "./state"

const styles = require("./modeler.scss")

export type IModelerProps = {
    state?: State
}

@inject("state") @observer
export class Modeler extends React.Component<IModelerProps, void> {
    render() {
        return <div className={styles.modeler}></div>
    }
}
