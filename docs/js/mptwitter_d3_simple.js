// start svg
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody().strength([-120]).distanceMax([500]))
    .force("center", d3.forceCenter(width / 2, height / 2));

var container = svg.append('g');

var dataPath = "https://ona-book.org/data/D3data.json";

// Zooming function translates the size of the svg container.
function zoomed() {
    container.attr(
    "transform", 
    "translate(" + d3.event.transform.x + ", " + d3.event.transform.y + ") scale(" + d3.event.transform.k + ")"
  );
}

// Call zoom for svg container.
svg.call(d3.zoom().on('zoom', zoomed));

// master Function
d3.json(dataPath, function(error, graph) {
  if (error) throw error; 

  // Linear scale for degree centrality.
  var degreeSize = d3.scaleLinear()
    .domain(
      [d3.min(graph.nodes, d => d.degree),
       d3.max(graph.nodes, d => d.degree)
      ]
     )
    .range([8,25]);
  
  // Collision detection based on degree centrality.
  simulation.force("collide", d3.forceCollide().radius(d => degreeSize(d.degree)));
  
  var link = container.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links, d => d.source + ", " + d.target)
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
    .attr('r', d => degreeSize(d.degree))
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    // Color by group (political party)
    .attr("fill", d => d.colour)
    .attr('class', 'node')
      
    node.append("title")
      .text(d => d.name + '\nParty: ' + d.group + '\nConstituency: ' + d.constituency + '\nFollowers: ' + d.followers.toString());
      
  function ticked() {
    // update edge coords
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    
    // update node coords
    node
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
  }

  // run ticked function and move nodes on every tick
  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);
  
  // update edges immediately
  simulation.force("link")
    .links(graph.links);
});


