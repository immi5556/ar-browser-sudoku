import Image from "./Image";

export default function displayImage(image: Image, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (context) {
      context.putImageData(image.toImageData(), 0, 0);
      /*document.getElementById("rest-capture").innerHTML = document.getElementById("rest-capture").innerHTML + "<img src='" + canvas.toDataURL('image/jpeg') + "'>";*/
  } else {
    console.log("No context");
  }
}
