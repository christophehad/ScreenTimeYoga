var addWeeks = function(data,svgEl,initY,initDelay) {
    data.week_dates.forEach(function(date,i){
      // create a <g> and put it in the right place
      // so that tiles are juxtaposed vertically
      let tileRow = svgEl.append("g")
                      .classed("tileRow", true)
                      .attr("transform",
                            "translate("+ctx.hmargin+","+(i*(ctx.tileDim+ctx.vmargin)+initY)+")");

      let orderedEntries = [];
      for (const [idx,column] of ctx.columns.entries()) {
        orderedEntries.push({
          column: column,
          values: data.rawCategories[column],
          index: idx
        })
      }

      // populate each row with tiles for each category
      let tiles = tileRow.selectAll("rect")
          .data(orderedEntries)
          .enter()
          .append("rect")
          .attrs((entry,j) => { return {
            width: ctx.tileDim, height: ctx.tileDim,
            x: ctx.tileDim + j*(ctx.tileDim+2*ctx.hmargin), y: 0,
            rx: 0.1*ctx.tileDim
          }})
          //.attr("fill", (entry) => ctx.colorScales[entry.column](entry.values[i]))
          //.style("opacity",0)
          .attr("fill","ghostwhite")
          .on("mouseover",function(e,d){if (!ctx.monthView) {return;} let scale = 0.8, newTileDim = scale*ctx.tileDim, shift = 0.5*(ctx.tileDim-newTileDim);
            d3.select(this).transition().duration(0.25*ctx.zoom_anim_duration).attrs({
              width: newTileDim, height: newTileDim,
              x: ctx.tileDim + d.index*(ctx.tileDim+2*ctx.hmargin)+shift, y: shift
            });})
          .on("mouseout",resetTile)
          .on("click",function(e,d){resetTile(e,d,d3.select(this));switchView()});
          //transition
          tiles.transition().delay(initDelay+i*100).duration(ctx.anim_duration).attr("fill", (entry) => ctx.colorScales[entry.column](entry.values[i]))//.style("opacity",1);
          //tooltip
          tiles.append("svg:title").text((entry,j)=>`${date} ${data.dates[i]}\n${ctx.columnNames[j]}: ${entry.values[i]} min`);

      tileRow.append("text")
          .attr("x", 3.5*ctx.hmargin)
          .attr("y", 0.5*ctx.tileDim)
          .style("font-size",`${0.6*ctx.tileDim}px`)
          .style("dominant-baseline","middle")
          .style("text-anchor","end")
          .text(date[0]);
  });
}

function resetTile(e,d,element=null){if (!ctx.monthView) {return;} let tile = element? element: d3.select(this);
  tile.transition().duration(ctx.zoom_anim_duration).attrs({
    width: ctx.tileDim, height: ctx.tileDim,
    x: ctx.tileDim + d.index*(ctx.tileDim+2*ctx.hmargin), y: 0
});}

var createMonthView = function(data, svgEl){
    ctx.ExtentOverAllCat = {};
    ctx.ExtentOverAllCatOverWeeks = [];
    //let overall_min = 9999999; let overall_max = -1;

    for (cat of ctx.columns) {
      let beforeExtents = [d3.min(data.before.rawCategories[cat]),d3.max(data.before.rawCategories[cat])];
      let afterExtents = [d3.min(data.after.rawCategories[cat]),d3.max(data.after.rawCategories[cat])];
      ctx.ExtentOverAllCat[cat] = [d3.min([beforeExtents[0],afterExtents[0]]), d3.max([beforeExtents[1],afterExtents[1]])];
      //overall_min = overall_min > ctx.ExtentOverAllCat[cat][0]? ctx.ExtentOverAllCat[cat][0] : overall_min;
      //overall_max = overall_max < ctx.ExtentOverAllCat[cat][1]? ctx.ExtentOverAllCat[cat][1] : overall_max;
    }

    // use same scale
    let overall_min = d3.min(Object.values(ctx.ExtentOverAllCat), (d)=>d[0]),
        overall_max = d3.max(Object.values(ctx.ExtentOverAllCat), (d)=>d[1]);

    let over_weeks_min = d3.min([d3.min(Object.values(data.before.avgCategoriesTotal)),d3.min(Object.values(data.after.avgCategoriesTotal))]),
        over_weeks_max = d3.max([d3.max(Object.values(data.before.avgCategoriesTotal)),d3.max(Object.values(data.after.avgCategoriesTotal))]);

    ctx.ExtentOverAllCat["overall"] = [overall_min,overall_max];
    ctx.ExtentOverAllCatOverWeeks = [over_weeks_min,over_weeks_max];
    ctx.ExtentDifferential = [d3.min(Object.values(data.dif)),d3.max(Object.values(data.dif))];

    ctx.colorScales = {};

    ctx.columns.forEach(function(column,idx) {
      ctx.colorScales[column] = d3.scaleLinear().domain([ctx.ExtentOverAllCat[column][0],ctx.ExtentOverAllCat[column][1]])
                                                .range(["ghostwhite",ctx.colors[idx]]);
    })

    svgEl.attr("transform","translate(0,"+ctx.buttonV+")");

    // for each week day add a group for its tiles

    let monthView = svgEl.append("g").attr("id","monthView");
    let titleFontSize = 0.65*ctx.tileDim;
    monthView.append("text").attr("id","title1")
      .attr("x", 0.5*ctx.hmargin)
      .attr("y", 0.5*titleFontSize)
      .attr("dominant-baseline","middle")
      .attr("font-weight","bold").attr("font-size",titleFontSize)
      .text("Initial Weeks (without Yoga)");
    addWeeks(data.before,monthView,1.5*titleFontSize,0);

    let beforeWeeks = data.before.week_dates.length;
    let numColumns = ctx.columns.length;
    let afterInitY = beforeWeeks*(ctx.tileDim+ctx.vmargin)+3*titleFontSize;

    monthView.append("text").attr("id","title2")
      .attr("x", 0.5*ctx.hmargin)
      .attr("y", afterInitY)
      .attr("dominant-baseline","middle")
      .attr("font-weight","bold").attr("font-size",titleFontSize)
      .text("Following Weeks (with Yoga)");

    addWeeks(data.after,monthView,afterInitY+titleFontSize,beforeWeeks*100);

    // Legend
    ctx.legendVSpacing = ctx.tileDim;

    let xEndTiles = (numColumns+4)*(ctx.tileDim+ctx.hmargin);
    let catLegend = monthView.append("g")
        .attr("id","categoryLegend")
        .attr("transform","translate("+xEndTiles+","+2*ctx.tileDim+")");
    let legendTileDim = 0.7*ctx.legendVSpacing;
    ctx.columns.forEach((column, i) => {
        catLegend.append("rect")
          .attrs({
            width: legendTileDim, height: legendTileDim,
            x: 0, y: i*ctx.legendVSpacing,
            rx: 0.1*legendTileDim
          })
          .attr("fill", ctx.colors[i]);
        catLegend.append("text")
          .attrs({
            x: legendTileDim+2*ctx.hmargin, y: 0.5*legendTileDim + i*ctx.legendVSpacing,
            "alignment-baseline": "middle",
            "font-size": 0.7*legendTileDim
          })
          .text(ctx.columnNames[i])
    });
    let monthViewWidth = monthView.node().getBoundingClientRect()["width"];

    // initially center it and hide button
    ctx.monthViewX = 0.5*(ctx.w-0.7*monthViewWidth);
    monthView.attr("transform",`translate(${ctx.monthViewX},0)`);
    d3.select("#yogaButton").style("opacity",0).style("visibility", "hidden");

    ctx.xEndMonthView = monthViewWidth + 5*ctx.tileDim;
};
