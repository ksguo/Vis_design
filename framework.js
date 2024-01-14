"use strict";

let excersiceInfo;

function initialiseWebpage() {
    // setup webpage with all needed elements, e.g. creating the title and the canvas to draw on etc.
    const main = document.getElementById("main");
    excersiceInfo = getExcerciseInfo();

    const title = document.createElement("h1");
    title.style.fontFamily = "inherit";
    title.style.textAlign = "center";
    title.textContent = "Visualisierung WS 21/22";
    main.appendChild(title);

    const subTitle = document.createElement("h2");
    subTitle.style.fontFamily = "inherit";
    subTitle.style.textAlign = "center";
    subTitle.textContent = "Übung " + excersiceInfo.excerciseNumber;
    main.appendChild(subTitle);
    document.title = "Vis WS 21/22 Übung " + excersiceInfo.excerciseNumber;

    const canvas = document.createElement("div");
    canvas.id = "canvas";
    canvas.style.width = "900px";
    canvas.style.height = "600px";
    canvas.style.margin = "4rem auto";
    main.appendChild(canvas);

    return canvas;
}

function main() {
    if (document.getElementById("canvas")) return; //already initialised
    const canvas = initialiseWebpage();

    const params = {
        width: 900,
        height: 600
    };
    //this is how to setup two.js for further information look into https://two.js.org/
    const two = new Two(params);
    two.appendTo(canvas);
    draw(two); // drawing action happening in app.js

    if (excersiceInfo.isAnimated) two.play();
    else two.update();
}

function prepareGraphData(data, keys) {
    let index = -1;
    const nodes = [];
    const nodeByKey = new Map; //map to find a node object by its attribute name
    const indexByKey = new Map; //map to find a node index by its attribute name
    const links = [];

    for (const k of keys) { // iterate over all attributes
        for (const d of data) { // iterate over all data points
            const key = JSON.stringify([k, d[k]]); // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
            if (nodeByKey.has(key)) { // dont store twice
                continue;
            }
            const node = { name: d[k] }; // create node for each existing attribute value
            nodes.push(node);
            // set pointers to index and object
            nodeByKey.set(key, node);
            indexByKey.set(key, ++index);
        }
    }

    for (let i = 1; i < keys.length; ++i) { // iterate over all attributes
        const a = keys[i - 1]; // get current attribute
        const b = keys[i]; // get next attribute
        const prefix = keys.slice(0, i + 1); // get all attributes before next, including next
        const linkByKey = new Map; //map to find a link object by its attributes names
        for (const d of data) { // iterate over all data points
            const names = prefix.map(k => d[k]);// get all attribute values of current data point
            const key = JSON.stringify(names);
            const value = d.value;
            if (linkByKey.has(key)) { // if link already exists, increment value
                let link = linkByKey.get(key);
                link.value += value;
            } else { //otherwise create new link with value 1
                let link = {
                    source: indexByKey.get(JSON.stringify([a, d[a]])),
                    target: indexByKey.get(JSON.stringify([b, d[b]])),
                    names,
                    value
                };
                links.push(link);
                linkByKey.set(key, link);
            }
        }
    }
    return { nodes, links };
}

/**
 * Given a list of nodes and links, returns a sankey generator.
 * For more information have a look at https://github.com/d3/d3-sankey.
 */
function getSankeyGenerator(width, height, nodes, links) {
    let sankey = d3.sankey() //d3 has a built in sankey graph, but we need to specify how it looks
        .nodeWidth(3) //set the width of the nodes (vertical) bars to 3
        .linkSort((a, b) => { // sort links according to the names alphabetically.
            let nameA;
            let nameB;
            //get two names that are unequal for this link
            for (let i = 0; i < a.names.length; i++) {
                nameA = a.names[i];
                nameB = b.names[i];
                if (nameA !== nameB) {
                    break;
                }
            }
            if (nameA > nameB) { //natural sorting of strings (lexicographical ordering)
                return 1;
            } else if (nameA < nameB) {
                return -1;
            } else {
                return 0;
            }
        })
        .nodePadding(25) //add spacing between the vertical bars
        .size([width, height]) //size of the diagram
        .nodes(nodes) //add the nodes
        .links(links); //add the links
    return sankey; //return the generator for the diagram so we can add it somewhere
}

/**
 * Draws the sankey diagram / parallel set, given a set of sankey nodes and sankey links.
 * color is an ordinal color scale that is used to color the first layer.
 */
function drawSankeyDiagram(two, nodes, links, color) {
    const svg = d3.select('svg');
    // draw all the nodes as rectangles
    svg.append("g")
        .selectAll("rect")
        .data(nodes) //bind the nodes
        .join("rect") //add a rectangle object for each node
        .attr("x", d => d.x0) //set coordinates of rectangles, already set by generator.
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0);
    // draw all the links as filled paths
    svg.append("g")
        .attr("fill", "none")
        .selectAll("g")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal()) //specific link for sankey diagram that looks nicer (can be done manually, but much more convenient!)
        .attr("stroke", d => color(d.names[0]))
        .attr("stroke-width", d => d.width)
        .style("mix-blend-mode", "multiply") //blending mode when multiple links overlap (see online documentation for examples)
        .append("title")
        .text(d => `${d.names.join(" → ")}\n${d.value.toString()}`); //add which label this is on hovering over the link
    // add labels to the nodes
    svg.append("g")
        .style("font", "10px sans-serif")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("x", d => d.x0 < two.width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < two.width / 2 ? "start" : "end") //text anchor switching position halfway, no extra margin needed this way.
        .text(d => d.name) //add the name
        .append("tspan") //add a tspan (subtext) within the text element, allows for different styling
        .attr("fill-opacity", 1.0)
        .text(d => ` ${d.value.toLocaleString()}`); //add the count of how many values

}

//call main function so something actually happens
main();