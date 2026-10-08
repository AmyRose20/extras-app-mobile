import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as locationsApi from '../api/locationsApi';

export type Pin = { latitude: number; longitude: number };

type Suggestion = { placeId: string; mainText: string; secondaryText: string };

// Roughly Ashford, Co. Wicklow — where the studios are
const DEFAULT_CENTER: Pin = { latitude: 52.99, longitude: -6.11 };

// A random id for one search "session" (all keystrokes + the final pick),
// so Google bills the whole search as one session.
function newSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Used as the address when Google has no address for a spot
function pinLabel(p: Pin) {
  return `Dropped pin (${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)})`;
}

type Props = {
  token: string;
  pin: Pin | null;                           // current pin, or null if none dropped yet
  onPinChange: (pin: Pin) => void;           // called whenever the pin moves
  onAddressFound: (address: string) => void; // called with the address for the new spot
  onNameFound?: (name: string) => void;      // called with a place name when a search result is picked
};

// A small map for choosing an exact meeting point:
// search for a place, tap the map, or drag the pin.
function MapPinPicker({ token, pin, onPinChange, onAddressFound, onNameFound }: Props) {
  const mapRef = useRef<MapView>(null);
  const sessionTokenRef = useRef(newSessionToken());

  // ----- Search -----
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);

  // ----- Pin / address lookup -----
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const center = pin ?? DEFAULT_CENTER;

  // Fetch suggestions 300ms after the coordinator stops typing (not on every keystroke)
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await locationsApi.getPlaceSuggestions(text, sessionTokenRef.current);
        setSuggestions((data.suggestions || []).slice(0, 3));
      } catch (error) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer); // typing again cancels the previous wait
  }, [query, token]);

  // Moves the map so the pin is in view
  const moveMapTo = (p: Pin) => {
    mapRef.current?.animateToRegion({ ...p, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
  };

  // A search result was tapped: get its exact location, then drop the pin there
  const selectSuggestion = async (s: Suggestion) => {
    setSuggestions([]);
    setQuery('');
    setLookupError('');
    setLookingUp(true);
    try {
      const data = await locationsApi.getPlaceDetails(s.placeId, sessionTokenRef.current);

      const newPin = { latitude: data.latitude, longitude: data.longitude };
      onPinChange(newPin);
      moveMapTo(newPin);
      if (data.address) onAddressFound(data.address);
      if (data.name && onNameFound) onNameFound(data.name);
    } catch (error) {
      setLookupError("Couldn't get that place. Try again, or tap the map.");
    } finally {
      setLookingUp(false);
      sessionTokenRef.current = newSessionToken(); // this search is finished; the next one is a new session
    }
  };

  // The map was tapped or the pin dragged: look up the address for that spot.
  // There's always an address afterwards: Google's, or "Dropped pin (...)" if none.
  const placePin = async (newPin: Pin) => {
    onPinChange(newPin);
    setLookupError('');
    setLookingUp(true);
    try {
      const data = await locationsApi.getAddressForPin(newPin.latitude, newPin.longitude);

      if (data.address) {
        onAddressFound(data.address);
      } else {
        onAddressFound(pinLabel(newPin)); // no address for this spot (e.g. a field)
      }
    } catch (error) {
      onAddressFound(pinLabel(newPin));
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <View style={mapStyles.wrapper}>
      {/* ----- Search box ----- */}
      <TextInput
        style={mapStyles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a place or address"
        placeholderTextColor="rgba(255,255,255,0.5)"
      />

      {/* ----- Map (stays in place) ----- */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={mapStyles.map}
        initialRegion={{ ...center, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        onPress={(e) => placePin(e.nativeEvent.coordinate)}
      >
        {pin ? (
          <Marker coordinate={pin} draggable onDragEnd={(e) => placePin(e.nativeEvent.coordinate)} />
        ) : null}
      </MapView>

      <Text style={mapStyles.hint}>
        {searching
          ? 'Searching...'
          : lookingUp
          ? 'Looking up address...'
          : pin
          ? 'Drag the pin or tap the map to adjust.'
          : 'Search above, or tap the map to drop a pin.'}
      </Text>
      {lookupError ? <Text style={mapStyles.error}>{lookupError}</Text> : null}

      {/* ----- Suggestions: last, so they float on top of the map ----- */}
      {suggestions.length > 0 ? (
        <View style={mapStyles.suggestionList}>
          {suggestions.map((s) => (
            <TouchableOpacity key={s.placeId} style={mapStyles.suggestion} onPress={() => selectSuggestion(s)}>
              <Text style={mapStyles.suggestionMain}>{s.mainText}</Text>
              {s.secondaryText ? <Text style={mapStyles.suggestionSecondary}>{s.secondaryText}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const mapStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    position: 'relative', // so the suggestions can float inside it
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  suggestionList: {
    position: 'absolute', // float over the map instead of pushing it down
    top: 52,              // just below the search box
    left: 0,
    right: 0,
    backgroundColor: '#241d3d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
  },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  suggestionMain: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionSecondary: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  map: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  error: {
    fontSize: 12,
    color: '#ff9d9d',
    marginTop: 4,
  },
});

export default MapPinPicker;