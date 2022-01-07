import React from 'react';
import * as d3 from "d3";
import usePrevious from "./usePrevious";
import { regressionPoly } from 'd3-regression';

function BrushChart({ data = [], x = '_x', y = '_y', children }) {

    const svgRef = React.useRef();
    const isInitialMount = React.useRef(true);
    const [prediction_data, setPredictionData] = React.useState([]);
    const [selection, setSelection] = React.useState();
    
    let dateExtent = d3.extent(data, d => new Date(d[x]));

    if (isInitialMount.current) {
        // Regression generator
        const regressionGenerator = regressionPoly()
        .x(d => new Date(d.collected_for_day))
        .y(d => d.total_accounts)

        // Calculate future prediction based on regression
        let regression = regressionGenerator(data)
        let prediction_date = d3.timeDay.offset(new Date(), 90)
        let prediction = regression.predict(prediction_date)
        let regression_data = [...data]
        regression_data.push({ 'collected_for_day': prediction_date.toISOString(), 'total_accounts': prediction })
     
       setPredictionData(regression_data)
       setSelection([dateExtent[0], prediction_date]);
       isInitialMount.current = false;
    }

    const margin = {
        left: 110,
        right: 70,
        top: 0,
        bottom: 50
    }

    // base width & height. All other calculations based on this value
    const svgWidth = 700
    const svgHeight = 95

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right

    // calculate forecast date
    let prediction_date = d3.max(prediction_data, d => new Date(d[x]))
    
    // define previous selection
    const previousSelection = usePrevious(selection);

    // will be called initially and on every data change
    React.useEffect(() => {
        const svg = d3.select(svgRef.current);
        const svgContent = svg.select(".content");

        // time scale for X axis
        const xScale = d3.scaleTime()
            .range([0, width])
            .domain([dateExtent[0], prediction_date])

        // Linear scale for counts
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(prediction_data, d => d[y])])

        // generator for svg path
        const lineGenerator = d3.line()
            .x(d => xScale(new Date(d[x])))
            .y(d => yScale(d[y]))
            .curve(d3.curveMonotoneX)

        // Generators svg area
        const areaGenerator = d3.area()
            .x(d => xScale(new Date(d[x])))
            .y0(d => yScale(0))
            .y1(d => yScale(d[y]))
            .curve(d3.curveMonotoneX)

        // draw line for current data
        svgContent
            .selectAll(".brush-current-data-line")
            .data([data])
            .join("path")
            .attr("class", "brush-current-data-line")
            .attr("stroke", "#7D7D7D")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("d", lineGenerator);

        // draw area chart for current data
        svgContent
            .selectAll(".brush-current-data-area")
            .data([data])
            .join("path")
            .attr("class", "brush-current-data-area")
            .attr("stroke", "none")
            .attr("fill", "url(#brush-gradient)")
            .attr("d", areaGenerator);

        // draw line for prediction data
        svgContent
            .selectAll(".brush-prediction-data-line")
            .data([prediction_data])
            .join("path")
            .attr("class", "brush-prediction-data-line")
            .attr("stroke", "#7D7D7D")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", 4)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("d", lineGenerator);

        // axes
        // define y-axis
        const yAxis = d3.axisLeft(yScale);

        // draw y-axis
        svg
            .select(".y-axis")
            .call(yAxis)
            .call(g => g.selectAll(".tick").remove())
            .call(g => g.select(".domain").attr("stroke", "#7D7D7D"));

        // define x-axis
        const xAxis = d3.axisBottom(xScale);

        // draw x-axis
        svg
            .select(".x-axis")
            .attr("transform", `translate(0, ${height})`)
            .attr('font-family','manrope')
            .call(xAxis)
            .call(g => g.select(".domain").attr("stroke", "#7D7D7D"))
            .call(g => g.selectAll(".tick>line").remove());


        // create brush
        const brush = d3.brushX()
            .extent([
                [0, 0],
                [width, height]
            ])
            .on("start brush end", (event) => {
                if (event.selection) {
                    const indexSelection = event.selection.map(xScale.invert);
                    setSelection(indexSelection);
                }
            });


        // set initial position + retaining position on resize
        if (previousSelection === selection || previousSelection === undefined) {
            svg
                .select(".brush")
                .call(brush)
                .call(brush.move, selection.map(xScale));
        }
    });

    return (
        <React.Fragment>
            {children({ selection, data, prediction_data })}
            <div>
                <svg ref={svgRef} width="100%" viewBox={'0 0 ' + svgWidth + ' ' + svgHeight}>
                    <linearGradient id="brush-gradient" x1="100%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3A7584" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#2C606D" stopOpacity="0.54" />
                    </linearGradient>
                    <g transform={'translate(' + margin.left + ',' + margin.top + ')'}>
                        <g className="content" />
                        <g className="brush" />
                        <g className="x-axis" />
                        <g className="y-axis" />
                    </g>
                </svg>
            </div>
        </React.Fragment>
    );
}

export default BrushChart;