var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Create form for search (see function below).
var search = d3.select("body").append('center').append('form').attr('onsubmit', 'return false;');

// A slider that removes nodes below the input threshold.
var slider = d3.select('body').append('p').append('center').text('Minimum value for connection: ').style('font-size', '75%');


// Call zoom for svg container.
svg.call(d3.zoom().on('zoom', zoomed));

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody().strength([-120]).distanceMax([500]))
    .force("center", d3.forceCenter(width / 2, height / 2));

var container = svg.append('g');

var dataPath = "https://ona-book.org/data/D3data.json"

var box = search.append('input')
  .attr('type', 'text')
  .attr('id', 'searchTerm')
  .attr('placeholder', 'Type to search...');

var button = search.append('input')
  .attr('type', 'button')
    .attr('value', 'Search')
    .on('click', function () { searchNodes(); });

// Toggle for ego networks on click (below).
var toggle = 0;


  d3.json(dataPath, function(error, graph) {
    if (error) throw error;

    // Make object of all neighboring nodes.
    var linkedByIndex = {};
    graph.links.forEach(function(d) {
      linkedByIndex[d.source + ',' + d.target] = 1;
      linkedByIndex[d.target + ',' + d.source] = 1;
    });

    // A function to test if two nodes are neighboring.
    function neighboring(a, b) {
      return linkedByIndex[a.index + ',' + b.index];
    }

    // Linear scale for degree centrality.
    var degreeSize = d3.scaleLinear()
      .domain([d3.min(graph.nodes, function(d) {return d.degree; }),d3.max(graph.nodes, function(d) {
        return d .degree; 
      })])
      .range([8,25]);

    // Collision detection based on degree centrality.
    simulation.force("collide", d3.forceCollide().radius( function (d) { return degreeSize(d.degree); }));

    var link = container.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(graph.links, function(d) { return d.source + ", " + d.target;})
      .enter().append("line")
        .attr('class', 'link')
        .style('stroke', '#808080');

    var node = container.selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("g")
      .attr("class", "node");
    
    node.append("circle")
      // Scale based on degree centrality 
      .attr('r', function(d, i) { return degreeSize(d.degree); })
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      // Color by group (political party)
        .attr("fill", function(d) { return d.colour; })
        .attr('class', 'node')
        // On click, toggle ego networks for the selected node.
        .on('click', function(d, i) {
          if (toggle == 0) {
            // Ternary operator restyles links and nodes if they are adjacent.
            d3.selectAll('.link').style('stroke-opacity', function (l) {
              return l.target == d || l.source == d ? 1 : 0.1;
            });
            d3.selectAll('.node').style('opacity', function (n) {
              return neighboring(d, n) ? 1 : 0.1;
            });
            d3.select(this).style('opacity', 1);
            toggle = 1;
          }
          else {
            // Restore nodes and links to normal opacity.
            d3.selectAll('.link').style('stroke-opacity', '0.6');
            d3.selectAll('.node').style('opacity', '1');
            toggle = 0;
          }
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

  node.append("title")
      .text(d => d.name + '\nParty: ' + d.group + '\nConstituency: ' + d.constituency + '\nFollowers: ' + d.followers.toString());

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      node
          .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    }


    slider.append('label')
      .attr('for', 'threshold')
          .text('1').style('font-value', 'bold')
          .style('font-size', '120%');
    slider.append('input')
      .attr('type', 'range')
      .attr('min', 1)
      .attr('max', d3.max(graph.links, function(d) {return d.value; }) / 2)
      .attr('value', 1)
      .attr('id', 'threshold')
      .style('width', '50%')
      .style('display', 'block')
      .on('input', function () { 
        var threshold = this.value;

        d3.select('label').text(threshold);

        // Find the links that are at or above the threshold.
        var newData = [];
        graph.links.forEach( function (d) {
          if (d.value >= threshold) {newData.push(d); };
        });

        // Data join with only those new links.
        link = link.data(newData, function(d) {return d.source + ', ' + d.target;});
        link.exit().remove();
        var linkEnter = link.enter().append('line').attr('class', 'link').style('stroke', '#808080');
        link = linkEnter.merge(link);

        node = node.data(graph.nodes);

        // Restart simulation with new link data.
        simulation
          .nodes(graph.nodes).on('tick', ticked)
          .force("link").links(newData);

        simulation.alphaTarget(0.1).restart();

      });

      // add profile photos

      node.append("defs")
          .append("pattern")
          .attr('id', d => 'image-' + d.name.split(" ").join(""))
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('x', d => -degreeSize(d.degree))
          .attr('y', d => -degreeSize(d.degree))
          .attr('height', d => degreeSize(d.degree) * 2)
          .attr('width', d => degreeSize(d.degree) * 2)
          .append("image")
          .attr('height', d => degreeSize(d.degree) * 2)
          .attr('width', d => degreeSize(d.degree) * 2)
          .attr('xlink:href', d => d.url);
      
      node.append("circle")
          .attr('r', d => 0.9 * degreeSize(d.degree))
          .attr('fill', d => 'url(#image-' + d.name.split(" ").join("") + ')');
          
    });


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Zooming function translates the size of the svg container.
function zoomed() {
    container.attr("transform", "translate(" + d3.event.transform.x + ", " + d3.event.transform.y + ") scale(" + d3.event.transform.k + ")");
}

// Search for nodes by making all unmatched nodes temporarily transparent.
function searchNodes() {
  var term = document.getElementById('searchTerm').value;
  var selected = container.selectAll('.node').filter(function (d, i) {
    return d.name.toLowerCase().search(term.toLowerCase()) == -1;
  });
  selected.style('opacity', '0');
  var link = container.selectAll('.link');
  link.style('stroke-opacity', '0');
  d3.selectAll('.node').transition()
    .duration(5000)
    .style('opacity', '1');
  d3.selectAll('.link').transition().duration(5000).style('stroke-opacity', '0.6');
}
