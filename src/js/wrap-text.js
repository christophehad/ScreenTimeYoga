// function for warping text: assume it contains several tspans
function wrap(text, width) {
    // root x and y
    let textX = text.attr("x"), textY = text.attr("y");
    let curX = parseFloat(textX), curDy = 0, lineHeight = 1.1;
    text.selectAll("tspan").each(function () {
        let curTspan = d3.select(this);
        let limitLength = width - curX;
        curTspan.attr("x",curX); curTspan.attr("y",textY); curTspan.attr("dy",curDy+"em"); // previous attributes
        let compTextLen = curTspan.node().getComputedTextLength();
        if (compTextLen > limitLength) {
          // split the tspan
          let words = curTspan.text().split(/\s+/).reverse();
          let line = [], word = words.pop();
          while (word || word === "") {
            line.push(word);
            curTspan.text(line.join(" "));
            if (curTspan.node().getComputedTextLength() > limitLength) {
              // new line
              line.pop();
              curTspan.text(line.join(" "));
              line = [word];
              curX = parseFloat(textX); curDy += lineHeight; // in em
              limitLength = width;
              curTspan = curTspan.append("tspan")
                                 .attr("x",curX).attr("y",textY) // we set the same Y as the first textY and adjust dy
                                 .attr("dy",curDy + "em")
                                 .text(word);
            }
            word = words.pop();
          }
          curX += curTspan.node().getComputedTextLength();
        }
        else {
          curTspan.attr("x",curX); curTspan.attr("y",textY); curTspan.attr("dy",curDy+"em");
          curX += compTextLen;
        }
    });
}
