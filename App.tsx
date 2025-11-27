import React, { useEffect, useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    TextInput, 
    View, 
    Button, // Mantido para referência, mas substituído por XboxButton na UI
    FlatList, 
    Image, 
    Alert, 
    ScrollView,
    TouchableOpacity, // Importação essencial para o botão customizado
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// A URL da API deve ser ajustada para o seu ambiente (IP local)
const API_URL = 'http://192.168.1.4:3000';

// --- Definição de Tipo (TypeScript) ---
type Place = {
    _id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    photo?: string | null;
    createdAt?: string;
};

// --- Componente Customizado de Botão (Estilo Xbox) ---
const XboxButton = ({ title, onPress, disabled = false }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.xboxButton, disabled && styles.xboxButtonDisabled]}
  >
    <Text style={styles.xboxButtonText}>{title}</Text>
  </TouchableOpacity>
);

// --- Componente Principal ---
export default function App() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            const res = await fetch(`${API_URL}/api/places`);
            if (!res.ok) {
                throw new Error('Erro na requisição de lugares');
            }
            const data = await res.json();
            setPlaces(data);
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            Alert.alert('Erro de Conexão', 'Não foi possível carregar os registros. Verifique a URL da API e a rede.');
        }
    };

    const getLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão negada', 'É necessário permitir o acesso à localização.');
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão negada', 'É necessário permitir o uso da câmera.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (asset.base64) {
                const base64Img = `data:image/jpeg;base64,${asset.base64}`;
                setPhoto(base64Img);
            } else if (asset.uri) {
                setPhoto(asset.uri);
            }
        }
    };

    const handleSave = async () => {
        if (!title || !description || latitude == null || longitude == null) {
            Alert.alert('Campos obrigatórios', 'Preencha título, descrição e localização.');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/places`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                    latitude,
                    longitude,
                    photo,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Erro ao salvar', errorData);
                Alert.alert('Erro', `Falha ao salvar o registro. Status: ${res.status}`);
                return;
            }

            const created = await res.json();
            setPlaces((prev) => [created, ...prev]);
            setTitle('');
            setDescription('');
            setLatitude(null);
            setLongitude(null);
            setPhoto(null);
            Alert.alert('Sucesso', 'Registro salvo com sucesso!');
        } catch (error) {
            console.error('Erro de rede ou processamento:', error);
            Alert.alert('Erro Crítico', 'Falha na conexão com o backend ou erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Place }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <Text style={styles.cardCoords}>
                📍 Lat: {item.latitude.toFixed(5)} | Lng: {item.longitude.toFixed(5)}
            </Text>
            {item.photo ? <Image source={{ uri: item.photo }} style={styles.cardImage} /> : null}
            {item.createdAt ? (
                <Text style={styles.cardDate}>
                    Criado em: {new Date(item.createdAt).toLocaleString()}
                </Text>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.title}>XBOX ESTILO</Text>
                <Text style={styles.subtitle}>Xbox Style UI</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Título (Ex: Loja de Jogos)"
                    placeholderTextColor={colors.placeholder}
                    value={title}
                    onChangeText={setTitle}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descrição (O que encontramos aqui?)"
                    placeholderTextColor={colors.placeholder}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
                
                {/* --- Seção de Localização --- */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>LOCALIZAÇÃO</Text>
                </View>
                <View style={styles.row}>
                    <XboxButton 
                        title="OBTER LOCALIZAÇÃO ATUAL" 
                        onPress={getLocation} 
                    />
                </View>
                <Text style={styles.coordsText}>Latitude: {latitude?.toFixed(5) ?? 'N/A'}</Text>
                <Text style={styles.coordsText}>Longitude: {longitude?.toFixed(5) ?? 'N/A'}</Text>

                {/* --- Seção de Foto --- */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>FOTO (OPCIONAL)</Text>
                </View>
                <View style={styles.row}>
                    <XboxButton 
                        title="TIRAR FOTO 📸" 
                        onPress={takePhoto} 
                    />
                </View>
                {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}

                {/* --- Seção de Ação --- */}
                <View style={styles.row}>
                    <XboxButton 
                        title={loading ? 'SALVANDO...' : 'SALVAR REGISTRO'} 
                        onPress={handleSave} 
                        disabled={loading} 
                    />
                </View>
            </ScrollView>

            <Text style={styles.listTitle}>🎯 REGISTROS ANTERIORES</Text>
            <FlatList
                data={places}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

// --- Definição de Cores Xbox ---
const colors = {
    background: '#1F1F1F',    // Preto/Cinza Escuro (Tema Xbox)
    primary: '#107C10',       // Verde Xbox principal
    secondary: '#3C3C3C',     // Cinza Claro para Inputs/Cards
    text: '#FFFFFF',          // Branco
    placeholder: '#AAAAAA',   // Cinza para Placeholder
    highlight: '#00B700',     // Verde de destaque
    disabled: '#555555',      // Cinza para desativado
};

// --- Estilos Xbox ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 40,
    },
    form: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '900', 
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.primary,
        marginBottom: 16,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary,
        paddingBottom: 4,
    },
    sectionHeader: {
        marginTop: 15,
        marginBottom: 5,
        paddingVertical: 5,
        borderBottomWidth: 2, // Mais destaque
        borderBottomColor: colors.primary,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: colors.secondary,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: colors.highlight,
        color: colors.text,
        fontSize: 16,
        marginBottom: 10,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        marginVertical: 10,
    },
    // --- Estilização do Botão Customizado (XboxButton) ---
    xboxButton: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3, 
    },
    xboxButtonDisabled: {
        backgroundColor: colors.disabled,
    },
    xboxButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    // --- Textos de Coordenadas e Prévia ---
    coordsText: {
        fontSize: 14,
        color: colors.placeholder,
        marginBottom: 2,
        paddingHorizontal: 5,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 6,
        marginTop: 10,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: colors.primary, // Borda verde destacada
    },
    // --- Lista e Cards ---
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.highlight,
        marginHorizontal: 20,
        marginVertical: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary,
        textTransform: 'uppercase',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: colors.secondary,
        borderRadius: 8,
        padding: 15,
        marginBottom: 12,
        borderLeftWidth: 5, // Destaque lateral verde
        borderLeftColor: colors.primary,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: colors.placeholder,
        marginBottom: 6,
    },
    cardCoords: {
        fontSize: 12,
        color: colors.placeholder,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    cardImage: {
        width: '100%',
        height: 150,
        borderRadius: 6,
        marginTop: 8,
    },
    cardDate: {
        fontSize: 11,
        color: colors.placeholder,
        marginTop: 6,
        textAlign: 'right',
    },
});