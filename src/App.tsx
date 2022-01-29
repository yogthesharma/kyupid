import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { API, IGeoJson, IUser, Properties2 } from "./api";
import Button from "./components/Button";
import Loading from "./assets/loading.svg";

import "./App.css";

type TFilters = "Age" | "Match" | "Users" | "Gender" | "ProUsers";

const averageAgeCalc = (users: Properties2["users"]) => {
  const processedArr = Math.round(
    users?.reduce((sum, value) => {
      return sum + value.age;
    }, 0) / users.length
  );
  return processedArr;
};

const totalMatch = (users: Properties2["users"]) => {
  const processedArr = users?.reduce((sum, value) => {
    return sum + value.total_matches;
  }, 0);
  return processedArr;
};

function App() {
  // init map vars
  const [lng] = useState(77.5946);
  const [lat] = useState(12.9716);
  const [zoom] = useState(9);
  const node = useRef<HTMLDivElement | null>(null);

  const [geoJson, setGeoJson] = useState<IGeoJson>();
  const [users, setUsers] = useState<IUser>();
  const [processedGeoJson, setProcessedGeoJson] =
    useState<IGeoJson["features"]>();

  const [filterType, setFilterType] = useState<TFilters>("Users");
  const [loading, setLoading] = useState<boolean>(false);

  const getGeoJsonData = useCallback(async () => {
    setLoading(true);
    const res = await API.getGeographicData();
    setLoading(false);
    setGeoJson(res);
  }, []);
  const getUserData = useCallback(async () => {
    setLoading(true);
    const res = await API.getUsersData();
    setLoading(false);
    setUsers(res);
  }, []);
  const getProUsers = useCallback((users: Properties2["users"]) => {
    const proUsers = users?.reduce((sum, value) => {
      return value.is_pro_user ? sum + 1 : sum;
    }, 0);
    return proUsers;
  }, []);

  const getGender = useCallback((users: Properties2["users"]) => {
    console.log(users);
    const female = users?.reduce((sum, value) => {
      return value.gender === "F" ? sum + 1 : sum;
    }, 0);
    const male = users?.reduce((sum, value) => {
      return value.gender === "M" ? sum + 1 : sum;
    }, 0);
    return { male, female };
  }, []);

  const filterActions = useMemo(
    () => [
      { label: "Age", value: "Age" },
      { label: "Match", value: "Match" },
      { label: "Users", value: "Users" },
      { label: "Gender", value: "Gender" },
      { label: "Pro Users", value: "ProUsers" },
    ],
    []
  );

  const processData = useCallback(() => {
    if (geoJson && users) {
      const processedArr = geoJson.features.map((geoFeature) => {
        return {
          ...geoFeature,
          properties: {
            ...geoFeature.properties,
            users: users.users.filter(
              (user) => user.area_id === geoFeature.properties.area_id
            ),
          },
        };
      });
      setProcessedGeoJson([...processedArr]);
    }
  }, [geoJson, users]);

  function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#11";
    for (var i = 0; i < 4; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  useEffect(() => {
    setLoading(true);
    if (node && node.current) {
      const map = new mapboxgl.Map({
        container: node.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [lng, lat],
        zoom: zoom,
      });

      map.on("load", () => {
        const popup = new mapboxgl.Popup({
          closeButton: false,
          // className: "mapPopup",
        });
        if (geoJson && geoJson.features) {
          if (processedGeoJson) {
            setLoading(false);
            processedGeoJson.forEach((mapElem) => {
              map.addSource(mapElem.properties.area_id.toString(), {
                type: "geojson",
                data: mapElem as unknown as string,
              });
              map.addLayer({
                id: mapElem.properties.area_id.toString(),
                type: "fill",
                source: mapElem.properties.area_id.toString(),
                layout: {},
                paint: {
                  "fill-color": getRandomColor(),
                  "fill-opacity": 0.3,
                },
              });

              map.on(
                "mouseenter",
                mapElem.properties.area_id.toString(),
                ({ features, lngLat }) => {
                  var renderHtml = null;
                  const htmlString = features?.length
                    ? features[0]?.properties
                    : "Loading....";

                  const polyonProperties: Properties2 = JSON.parse(
                    JSON.stringify(htmlString)
                  );

                  if (filterType === "Age") {
                    renderHtml = `Area Name: <strong>${
                      polyonProperties.name
                    }</strong> <br /> Avg. age of users: ${averageAgeCalc(
                      JSON.parse(polyonProperties.users as unknown as string)
                    )} yrs`;
                  } else if (filterType === "Users") {
                    renderHtml = `Area Name: <strong>${
                      polyonProperties.name
                    }</strong> <br /> Number of users: ${
                      JSON.parse(polyonProperties.users as unknown as string)
                        .length
                    }`;
                  } else if (filterType === "Match") {
                    // totalMatch
                    renderHtml = `Area Name: <strong>${
                      polyonProperties.name
                    }</strong> <br /> Total number of matches: ${totalMatch(
                      JSON.parse(polyonProperties.users as unknown as string)
                    )}`;
                  } else if (filterType === "Gender") {
                    // totalMatch
                    renderHtml = `Area Nam: <strong>${
                      polyonProperties.name
                    }</strong> <br /> Total number of females: ${
                      getGender(
                        JSON.parse(polyonProperties.users as unknown as string)
                      ).female
                    } <br /> Total number of males: ${
                      getGender(
                        JSON.parse(polyonProperties.users as unknown as string)
                      ).male
                    }`;
                  } else if (filterType === "ProUsers") {
                    // totalMatch
                    renderHtml = `Area Nam: <strong>${
                      polyonProperties.name
                    }</strong> <br /> Total number of Pro Users: ${getProUsers(
                      JSON.parse(polyonProperties.users as unknown as string)
                    )}`;
                  }

                  popup
                    .setLngLat(lngLat)
                    .setHTML(renderHtml as string)
                    .addTo(map);
                  map.getCanvas().style.cursor = "pointer";
                }
              );
              map.on(
                "mouseleave",
                mapElem.properties.area_id.toString(),
                () => {
                  map.getCanvas().style.cursor = "";
                  popup.remove();
                }
              );
            });
          }
        }
      });
    }
  }, [
    geoJson,
    lat,
    lng,
    zoom,
    filterType,
    processedGeoJson,
    getGender,
    getProUsers,
  ]);

  useEffect(() => {
    if (!(processedGeoJson && processedGeoJson.length)) {
      getUserData();
      getGeoJsonData();
      processData();
    }
  }, [getGeoJsonData, getUserData, processData, processedGeoJson]);

  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <img src={Loading} alt="Loading..." />
        ) : (
          <div className="flex absolute top-4 left-1/2 z-50 -translate-x-1/2">
            {filterActions.map((action) => (
              <Button
                key={action.value}
                isCurrFilter={action.value === filterType}
                onClick={() => setFilterType(action.value as TFilters)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </header>
      <div ref={node} className="mapContanier" />
    </div>
  );
}

export default App;
