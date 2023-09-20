function onImgMouseOver(event) {
  event.target.src = "otherme.png";
}
function onImgMouseLeave(event) {
  event.target.src = "me.png";
}
function onActivitiesUlMouseWheel(event) {
  console.log(document.body.clientWidth);
  if (document.body.clientWidth >= 768) return;
  event.preventDefault();
  const activitesUl = document.getElementById("activities-ul");
  activitesUl.scrollLeft +=
    Math.sign(event.deltaY) * activitesUl.children.item(0).clientWidth;
}
