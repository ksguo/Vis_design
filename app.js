function getExcerciseInfo() {
    return {
        excerciseNumber: 1,
        isAnimated: false
    }
}


function classifyData(data) {
    return data.map(d => {
        // 对成绩进行分类
        let gradeCategory;
        if (d.Grade <= 1) gradeCategory = 'Sehr gut';
        else if (d.Grade <= 2) gradeCategory = 'Gut';
        else if (d.Grade <= 3) gradeCategory = 'Befriedigend';
        else if (d.Grade <= 4) gradeCategory = 'Ausreichend';
        else gradeCategory = 'Nicht Bestand';

        // 对完成时间进行分类
        let timeCategory;
        if (d['Time to complete exam'] <= 20) timeCategory = 'weniger als 20min';
        else if (d['Time to complete exam'] <= 40) timeCategory = '20-40min';
        else if (d['Time to complete exam'] <= 60) timeCategory = '40-60min';
        else timeCategory = 'mehr als 60min';

        return { ...d, Grade: gradeCategory, 'Time to complete exam': timeCategory };
    });
}




function draw(two) {
    d3.csv('DesignuebungGradingData.csv').then(data => {
        let processedData = classifyData(data); // 使用上面定义的函数对数据进行分类

        // 定义带有透明度的颜色数组
        const translucentColors = [
            'rgba(130, 180, 220, 0.7)',  // 柔和蓝
            'rgba(255, 230, 150, 0.7)',  // 暖黄
            'rgba(199, 134, 113, 0.7)',  // 柔和红棕色
            'rgba(195, 155, 211, 0.7)',  // 柔和紫色
            'rgba(137, 166, 196, 0.7)',  // 柔和淡蓝
            'rgba(240, 240, 240, 0.7)',  // 浅灰
            'rgba(210, 170, 110, 0.7)',  // 淡棕
            'rgba(180, 180, 180, 0.7)',  // 中等灰

        ];

        // 使用带有透明度的颜色比例尺
        const color = d3.scaleOrdinal(translucentColors);

        //设置属性顺序
        const attributeOrder = ['Time to complete exam','Attemptnumber', 'Grade']; // 根据你的数据结构调整
        const combinationCounts = calculateAttributeValueCombinationCounts(processedData);
        console.log(combinationCounts);
        drawParallelSets(combinationCounts, attributeOrder, color, two);
    });
}


function calculateAttributeValueCombinationCounts(data) {
    const combinationByNames = new Map(); // map to get combination index by attribute names
    const combinationCounts = [];
    data.forEach(d => {
        const key = JSON.stringify(d); // use string representation of object as key
        if (!combinationByNames.has(key)) { // if combination already occured before
            let dCopy = _.cloneDeep(d); // get deep copy of object
            dCopy.value = 1; // add attribute "value" and set it to 1
            combinationCounts.push(dCopy); // add combination
            combinationByNames.set(key, combinationCounts.length - 1) // set pointer to the corresponding index;
        } else {
            combinationCounts[combinationByNames.get(key)].value += 1; // increment value
        }
    })
    return combinationCounts;
}

/**
 * Draws a parallel set visualisation, given an attributeOrder and counts for each combination of the different attribute values.
 * Color is an ordinal color scale that is used to color the first layer of the viusalisation.
 */
function drawParallelSets(combinationCounts, attributeOrder, color, two) {
    const graph = prepareGraphData(combinationCounts, attributeOrder); // create graph data as input for sankey generator
    const graphCopy = _.cloneDeep(graph); // deep copy of the graph
    const sankey = getSankeyGenerator(two.width, two.height, graphCopy.nodes, graphCopy.links) //get sankey generator
    const { nodes, links } = sankey(); // call generator
    drawSankeyDiagram(two, nodes, links, color); //draw chart
}


