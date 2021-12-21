import React from 'react';
import * as d3 from "d3";


function Barchart({ data = [], app_data = [], x = '_x', y = '_y', compare = `app_accounts_last_30_days`, label_type, goals, setTooltip}) {

    const svgRef = React.useRef();

    // set default compare value to 30
    if (compare == 'app_accounts_last__days') compare = 'app_accounts_last_30_days'

    let app_lookup = {}
    app_data.forEach(d => app_lookup[d.slug] = d)

    // sort data
    data.sort((a, b) => d3.descending(a[x], b[x]))

    // filter data to include only top 10
    data = data.filter((d, i) => i < 10)

    // sort top 10
    data.sort((a, b) => d3.ascending(a[x], b[x]))


    data.forEach(d => {
        if (!d.hasOwnProperty(compare)) d[compare] = 0
    })

    // margins for SVG
    const margin = {
        left: 200,
        right: 50,
        top: 0,
        bottom: 75
    }

    // responsive width & height
    const svgWidth = 750
    const svgHeight = 425

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right

    React.useEffect(() => {

        // set d3 references
        const svg = d3.select(svgRef.current);
        const svgContent = svg.select(".content");
        const defs = svg.select("defs");

        // Linear scale for x-axis
        const xScale = d3.scaleLinear()
            .range([0, width])
            .domain([0, d3.max(data, d => d[x])])

        // Scale for y-axis
        const yScale = d3.scaleBand()
            .range([height, 0])
            .domain(data.map(d => d[y])).padding(0.1)

        const createTickLabel = (d) => {
            return app_lookup[d].title
        }

        // axes
        // scale y-axis
        const yAxis = d3.axisLeft(yScale).tickFormat(createTickLabel).tickPadding(70);

        // draw y-axis
        svg
            .select(".y-axis")
            .call(yAxis)
            .attr('font-family', 'manrope')
            .attr('font-size', '0.7em')
            .call(g => g.selectAll(".tick>line").remove())
            .call(g => g.select(".domain").remove());

        // scale x-axis
        const xAxis = d3.axisBottom(xScale);

        // draw x-axis
        svg
            .select(".x-axis")
            .attr("transform", `translate(0, ${height})`)
            .attr('font-family', 'manrope')
            .attr('font-size', '0.7em')
            .call(xAxis)
            .call(g => g.select(".domain").attr("stroke", "#CFCFCF"))
            .call(g => g.selectAll(".tick>line").attr("stroke", "#CFCFCF"))

        // draw x-axis gridlines
        svg
            .select(".x-axis")
            .append('g')
            .attr('class', 'x-grid')
            .call(xAxis.tickSize(-height).tickFormat(""))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick>line")
                .attr("stroke", "#CFCFCF")
                .attr("stroke-dasharray", 10)
                .attr('opacity', .5))
            .call(g => g.select(".tick>line").remove())

        // draw y-axis gridlines
        svg
            .select(".y-axis")
            .append('g')
            .attr('class', 'y-grid')
            .call(yAxis.tickSize(-width).tickFormat(""))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick>line")
                .attr("stroke", "#CFCFCF")
                .attr('opacity', .3))

        // draw pre-growth bar with tooltip on hover
        svgContent
            .selectAll(".pre-growth-bar")
            .data(data)
            .join('rect')
            .attr('x', 0)
            .attr('y', d => yScale(d[y]))
            .attr('height', yScale.bandwidth())
            .attr('width', d => xScale(d[x]) - (xScale(d[x] - d[compare])))
            .attr("class", "pre-growth-bar transition-all")
            .attr("stroke", "none")
            .attr("fill", "url(#bar-gradient)")
            .attr("opacity", 1)
            .on("mouseover", (event,d) => {
                let data = {
                    [d.app]:"",
                    'Total Accounts' : d.total_accounts
                }
                setTooltip({visible:true, data:data, x: event.pageX, y: event.pageY})
            })
            .on("mouseout", (event,d) => {
                setTooltip({visible:false, data:{}, x: event.pageX, y: event.pageY})
            })

        // draw growth bar with tooltip on hover
        svgContent
            .selectAll(".growth-bar")
            .data(data)
            .join('rect')
            .attr('x', d => xScale(d[x]) - (xScale(d[x] - d[compare])))
            .attr('y', d => yScale(d[y]))
            .attr('height', yScale.bandwidth())
            .attr('width', d => xScale(d[x] - d[compare]))
            .attr("class", "growth-bar transition-all")
            .attr("stroke", "none")
            .attr("fill", "#7FADBC")
            .on("mouseover", (event,d) => {
                let data = {
                    [d.app]:"",
                    [compare.replaceAll("_", " ")] : d[compare]
                }
                setTooltip({visible:true, data:data, x: event.pageX, y: event.pageY})
            })
            .on("mouseout", (event,d) => {
                setTooltip({visible:false, data:{}, x: event.pageX, y: event.pageY})
            })

        // add growth %/# label to end of bar
        svgContent
            .selectAll(".growth-text")
            .data(data)
            .join('text')
            .attr('x', d => xScale(d[x])+ 5)
            .attr('y', d => yScale(d[y]) + yScale.bandwidth() / 2 + 4)
            .text(d => label_type === 'Percent' ? '+' + Math.floor((d[x] - d[compare]) / d[compare] * 100) + '%' : '+'+d[compare])
            .attr('class', 'growth-text')
            .attr('font-size', '0.7em')
            .attr('text-anchor', 'left') 

        // add logos
        // set logo diameter
        const logo_size=25

        // create mask for logos
        defs
            .selectAll(".logo-clip")
            .data(Array.from(new Set(data.map(d => d[y]))))
            .join("mask")
            .attr("id", d => "logo-clip-" + d)
            .attr('class', 'logo-clip')
            .append("circle")
            .attr("cx", logo_size/2)
            .attr("cy", logo_size/2)
            .attr("r", logo_size/2)
            .attr('fill','white')

        // add in logos with mask
        var logo = svg.selectAll(".logo")
            .data(Array.from(new Set(data.map(d => d[y]))))
            .join('a')
            .attr('class', 'logo')
            .attr('href',d => app_lookup[d].website)
            .attr('target','_blank')
            .append('image')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", logo_size)
            .attr("height", logo_size)
            .attr("xlink:href", d => app_lookup[d].logo)
            .attr("mask", d => "url(#logo-clip-" + d + ")")
            .attr("transform", d => "translate(" + '150' + "," + yScale(d) + ")")

        // goals
        // draw goal line
        svgContent
            .selectAll(".goal-line")
            .data(goals)
            .join('line')
            .attr('x1', d => xScale(d))
            .attr('y1', 0)
            .attr('x2', d => xScale(d))
            .attr('y2', height)
            .attr('class', 'goal-line')
            .attr('stroke', "#FFFFFF")

        // draw label box
        svgContent
            .selectAll(".goal-label-box")
            .data(goals)
            .join('rect')
            .attr('x', d => xScale(d) - 20)
            .attr('y', height + 24)
            .attr('width', 40)
            .attr('height', 20)
            .attr('rx', 10)
            .attr("class", "goal-label-box")
            .attr("stroke", "#A066B5")
            .attr("stroke-width", 2)
            .attr("fill", "none")

        // add label text
        svgContent
            .selectAll(".goal-label-text")
            .data(goals)
            .join('text')
            .attr('x', d => xScale(d))
            .attr('y', height + 35)
            .text(d => d / 1000 + 'k')
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('class', 'goal-label-text')
            .attr('fill', '#A066B5')
            .attr('font-size', '0.7em')

        // draw legend boxes
        const size = 10
        
        svg.selectAll('.pre-growth-legend-box')
            .data([0])
            .join("rect")
            .attr('class','pre-growth-legend-box')
            .attr("x",margin.left)
            .attr("y",height+55)
            .attr("width", size)
            .attr("height", size)
            .style("fill", "url(#bar-gradient)")

        svg.selectAll('.growth-legend-box')
            .data([0])
            .join("rect")
            .attr('class','growth-legend-box')
            .attr("x",margin.left+190)
            .attr("y",height+55)
            .attr("width", size)
            .attr("height", size)
            .style("fill", "#7FADBC")

        // set text for dynamic growth legend text
        let compare_text
        if (compare === 'app_accounts_last_30_days') {
            compare_text = '30 days'
        } else if (compare === 'app_accounts_last_60_days') {
            compare_text = '60 days'
        } else {
            compare_text = '90 days'
        } 

        // add legend text
        svg.selectAll('.pre-growth-legend-text')
            .data([0])
            .join("text")
            .attr('class','pre-growth-legend-text')
            .attr("x",margin.left+15)
            .attr("y", height+61)
            .text("Previously Created Accounts")
            .style("font-size", "0.7em")
            .attr("alignment-baseline","middle")

        svg.selectAll('.growth-legend-text')
            .data([0])
            .join("text")
            .attr('class','growth-legend-text')
            .attr("x", margin.left+205)
            .attr("y", height+61)
            .text("Accounts Created in the Last "+compare_text)
            .style("font-size", "0.7em")
            .attr("alignment-baseline","middle")

        // load the watermark in as data
        d3.xml("/images/logo_nm.svg").then(watermark => {

            // use d3 join to ensure that additional watermarks are not continuously added.
            svg
            .selectAll('.watermark')
            .data([0])
            .join('g')
            .html('') // need to empty the group as React does not play well with append.
            .attr('class','watermark watermark-bottom')
            .node()
            .append(watermark.documentElement);

            // set attributes of watermark
            d3.selectAll('.watermark-bottom svg')
            .attr("y", height-50)
            .attr("x",width+55)
            .attr("height",20*1.5)
            .attr("width",76*1.5)
            .attr('opacity', 0.1)
        })


    });

    return (
        <React.Fragment>
            <svg ref={svgRef} width="100%" viewBox={'0 0 ' + svgWidth + ' ' + svgHeight}>
                <defs>
                </defs>
                <linearGradient id="bar-gradient" x1="0" y1="100%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D7D9ED" stopOpacity="1" />
                    <stop offset="100%" stopColor="#C4DFE5" stopOpacity="1" />
                </linearGradient>
                <g transform={'translate(' + margin.left + ',' + margin.top + ')'}>
                    <g className="x-axis" />
                    <g className="y-axis" />
                    <g className="content" />
                </g>
            </svg>
        </React.Fragment>
    )
}

export default Barchart;