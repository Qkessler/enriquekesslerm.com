function documentReadyCallback() {
  if (typeof mapboxgl !== "undefined") {
    document.querySelectorAll(".map").forEach((el, i) => {
      el.setAttribute("id", `map-${i}`);

      mapboxgl.accessToken = el.querySelector(".mapbox-access-token").textContent.trim();
      let zoom = el.querySelector(".mapbox-zoom").textContent.trim();

      let map = new mapboxgl.Map({
          container: `map-${i}`,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [37.837, -0.98623],
          zoom: zoom,
      });

      map.addControl(new mapboxgl.NavigationControl());

      let geojson = JSON.parse(el.querySelector(".mapbox-geojson").textContent.trim());

      const center = [0, 0];

      geojson.features.forEach(function (marker) {
          console.log(`marker: ${JSON.stringify(marker)}`);
        center[0] += marker.coordinates[0];
        center[1] += marker.coordinates[1];

        new mapboxgl.Marker()
          .setLngLat(marker.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 10 }) // add popups
              .setHTML("<p>" + marker.text + "</p>")
          )
          .addTo(map);
      });

      center[0] = center[0] / geojson.features.length;
      center[1] = center[1] / geojson.features.length;

      map.setCenter(center);
    });
  }
};

if (document.readyState === 'loading') {  // Loading hasn't finished yet
  document.addEventListener('DOMContentLoaded', documentReadyCallback);
} else {  // `DOMContentLoaded` has already fired
  documentReadyCallback();
}
