import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabase("db.LocationDB");

class App extends React.Component {
  /**
   * Constructor
   * @param {mixed} props
   */
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      ready: false,
      where: { lat: null, lng: null },
      error: null
    };
    // Check if the items table exists if not create it
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, Longitude TEXT, Latitude TEXT, count INTEGER)"
      );
    });
    // Call fetchData method
    this.fetchData();
  }

  /**
   * Read method uses arrow-function syntax
   */
  fetchData = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM items",
        null, 
        (txObj, { rows: { _array } }) => this.setState({ data: _array }),
        (txObj, error) => console.log("Error ", error)
      ); 
    }); 
  };


  /**
 * Create method an event handler for current location and create it
 */
  newLocation = () => {
      let goeOptions = {
        enableHighAccuracy: true,
        timeOut: 20000,
        maximumAge: 60 * 60 * 24
      };
      this.setState({ ready: false, error: null });
      navigator.geolocation.getCurrentPosition(this.geoSucces, this.geoFailure, goeOptions);
  };
  geoSucces = (position) => {
    this.newItem(position.coords.longitude, position.coords.latitude);
    this.setState({
      ready: true,
      where: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    });
  };
  geoFailure = (err) => {
    this.setState({ error: err.message });
  }
  /**
* Create method an event handler for new Location creation
*/
  newItem = (Longitude, Latitude) => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO items (Longitude, Latitude, count) values (?, ?, ?)",
        [Longitude, Latitude, 0],
        (txObj, resultSet) =>
          this.setState({
            data: this.state.data.concat({
              id: resultSet.insertId,
              count: 0,
              Longitude: Longitude,
              Latitude: Latitude,
            }),
          }),
        (txObj, error) => console.log("Error", error)
      );
    });
  };

  /**
 * Update method an event handler for item changes
 * @param {int} id
 */
  increment = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE items SET count = count + 1 WHERE id = ?",
        [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let newList = this.state.data.map((data) => {
              if (data.id === id) return { ...data, count: data.count + 1 };
              else return data;
            });
            this.setState({ data: newList });
          }
        }
      );
    });
  };

  /**
 * Delete method an event handler for item removal
 * @param {int} id
 */
  delete = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM items WHERE id = ? ",
        [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let newList = this.state.data.filter((data) => {
              if (data.id === id) return false;
              else return true;
            });
            this.setState({ data: newList });
          }
        }
      );
    });
  };

  /**
   * Required render, called when state is altered
   */
  render() {
    return (
      <View style={Style.main}>

        <ScrollView style={Style.widthfull}>

          <TouchableOpacity onPress={() => this.newLocation()} style={Style.green}>
            <Text style={Style.white}>Add Current Location</Text>
          </TouchableOpacity>

          {this.state.error && (
            <Text style={Style.list}>
              {this.state.error}
            </Text>
          )}

          {this.state.ready && (
            <Text style={Style.list}>
              {`
                Your current location is:
                Latitude: ${this.state.where.lat}
                Longitude: ${this.state.where.lng}
              `}
            </Text>
          )}
          {this.state.data &&
            this.state.data.map((data) => (
              <View key={data.id} style={Style.list}>
                <Text style={Style.badge}>{`${data.count}`}</Text>
                <Text style={Style.text}>
                  {`
                  Latitude: ${data.Latitude}
                  Longitude: ${data.Longitude}
                  `}
                </Text>
                <View style={Style.flexRow}>
                  <TouchableOpacity onPress={() => this.increment(data.id)}>
                    <Text style={Style.boldGreen}> + </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.delete(data.id)}>
                    <Text style={Style.boldGreen}> Remove </Text>
                  </TouchableOpacity>
                  </View>
              </View>
            ))}


        </ScrollView>
      </View>
    );
  }
}
export default App;

/**
 * Style prop
 */
const Style = StyleSheet.create({
  econtainer: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#95a5a6",
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 4,
  },
  list: {
    backgroundColor: "#bdc3c7",
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
    margin: 8,
    color: "#006266",
  },
  main: {
    backgroundColor: "#ecf0f1",
  },
  widthfull: {
    margin: 30,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
  green: {
    borderRadius: 48,
    backgroundColor: "#2980b9",
  },
  white: {
    padding: 4,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#bdc3c7",
  },
  boldGreen: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#8e44ad",
  },
  boldRed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9b59b6",
  },
  badge: {
    backgroundColor: "#34495e",
    color: "#ecf0f1",
    fontWeight: "bold",
    fontSize: 16,
    borderRadius: 48,
    minWidth: 30,
    padding: 4,
    textAlign: "center",
  },
  text: {
    textAlign: "center",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
});
