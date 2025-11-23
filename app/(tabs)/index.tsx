import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ListRenderItemInfo
} from 'react-native';

// -------------------------------------------------------------
// CONFIGURAÇÃO DO IP
// -------------------------------------------------------------
// Substitua pelo IPv4 da sua máquina (ex: 192.168.0.15)
// No Windows, rode 'ipconfig'. No Mac/Linux, rode 'ifconfig'.
// NÃO use 'localhost' se estiver testando no celular físico ou emulador Android.
const API_URL = 'http://192.168.0.109:8080/user'; 

// Interface para definir a estrutura do Usuário
interface User {
  id: number;
  name: string;
  email: string;
}

export default function App() {
  // Estados com tipagem explícita
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- CRUD OPERATIONS ---

  // 1. READ (Listar)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível conectar ao servidor Spring Boot.\nVerifique o IP e se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. CREATE & UPDATE (Criar e Editar)
  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos!");
      return;
    }

    const userData = { name, email };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setName('');
        setEmail('');
        setEditingId(null);
        fetchUsers(); // Recarrega a lista
      } else {
        Alert.alert("Erro", "Falha ao salvar usuário.");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro de conexão.");
    }
  };

  // 3. DELETE (Deletar)
  const handleDelete = async (id: number) => {
  const confirmDelete =
    Platform.OS === 'web'
      ? window.confirm("Deseja realmente excluir este usuário?")
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Confirmar",
            "Deseja realmente excluir este usuário?",
            [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Excluir", onPress: () => resolve(true) }
            ]
          );
        });

  if (!confirmDelete) return;

  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  fetchUsers();
};

  // Prepara formulário para edição
  const handleEdit = (user: User) => {
    setName(user.name);
    setEmail(user.email);
    setEditingId(user.id);
  };

  const handleCancel = () => {
    setName('');
    setEmail('');
    setEditingId(null);
  }

  // --- RENDER ---

  const renderItem = ({ item }: ListRenderItemInfo<User>) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.btnEdit}>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.btnDelete}>
          <Text style={styles.btnText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciador de Usuários</Text>
        <Text style={styles.subtitle}>Spring Boot + React Native (TSX)</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.form}
      >
        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <View style={styles.formButtons}>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
            <Text style={styles.btnSaveText}>
                {editingId ? "Atualizar Usuário" : "Cadastrar Usuário"}
            </Text>
            </TouchableOpacity>

            {editingId && (
                <TouchableOpacity style={styles.btnCancel} onPress={handleCancel}>
                    <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>
            )}
        </View>
      </KeyboardAvoidingView>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Lista de Cadastrados</Text>
            <TouchableOpacity onPress={fetchUsers}>
                <Text style={styles.refreshText}>↻ Atualizar</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ea',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSave: {
    backgroundColor: '#03dac6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  btnCancel: {
    backgroundColor: '#cf6679',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshText: {
    color: '#6200ea',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardEmail: {
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
  },
  btnEdit: {
    backgroundColor: '#ff9800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  btnDelete: {
    backgroundColor: '#f44336',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
  }
});