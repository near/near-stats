import React from "react";
import styles from '../styles/tooltip.module.scss'
import * as d3 from "d3";

function Tooltip({ visible, data, x, y }) {

    const tooltipRef = React.useRef();

    let html = ""

    for (const [key, value] of Object.entries(data)) {
        html += `<div><strong>${key}</strong>${value != "" ? ": " + value : ""}</div>`
    }

    React.useEffect(() => {
        const tooltip = d3.select(tooltipRef.current)

        tooltip
            .html(html)
            .style("left", (x + 50) + "px")
            .style("top", y + "px")
            .style("opacity", visible == true ? 1 : 0)

    })

    return (
        <React.Fragment>
            <div ref={tooltipRef} className={styles.tooltip}>
            </div>
        </React.Fragment>
    );

}

export default Tooltip;