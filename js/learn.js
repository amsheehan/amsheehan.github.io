// Make scope global
paper.install(window);
window.onload = function() {
  paper.setup('thisCanvas');
  var path = new Path();
  path.strokeColor = 'black';
  var start = new Point(400, 400);
  path.moveTo(start);
  path.lineTo(start.add([200, -50]))
  view.draw();
}
