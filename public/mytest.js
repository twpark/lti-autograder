var annotations = []

function myTestfunction1(annotation) {
  console.log(annotation.text);
  annotations.push(annotation);

  for (var a of annotations) {
    console.log(a.text);
  }
}
