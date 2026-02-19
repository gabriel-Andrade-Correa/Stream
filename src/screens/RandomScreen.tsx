import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useAppContext } from '../context/AppContext';
import { searchTitles, fetchTrending } from '../services/api';
import { TitleItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

type GenreOption = {
  id: string;
  label: string;
  query: string;
};

const GENRES: GenreOption[] = [
  { id: 'romance', label: 'Romance', query: 'romance' },
  { id: 'acao', label: 'Acao', query: 'acao' },
  { id: 'comedia', label: 'Comedia', query: 'comedia' },
  { id: 'drama', label: 'Drama', query: 'drama' },
  { id: 'terror', label: 'Terror', query: 'terror' },
  { id: 'ficcao', label: 'Ficcao', query: 'ficcao cientifica' }
];

function pickRandom<T>(items: T[]) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] || null;
}

function filterBySelectedPlatforms(items: TitleItem[], selected: string[]) {
  if (!selected.length) return items;
  return items.filter((item) => (item.availableOn || []).some((name) => selected.includes(name)));
}

export function RandomScreen({ navigation }: Props) {
  const { selectedPlatforms } = useAppContext();

  const [genre, setGenre] = useState<GenreOption>(GENRES[0]);
  const [randomType, setRandomType] = useState<'filme' | 'serie' | 'all'>('filme');
  const [loading, setLoading] = useState(false);
  const [pickedTitle, setPickedTitle] = useState<TitleItem | null>(null);

  const [groupInput, setGroupInput] = useState('');
  const [groupList, setGroupList] = useState<string[]>([]);
  const [groupResult, setGroupResult] = useState<string>('');
  const [groupRouletteVisible, setGroupRouletteVisible] = useState(false);
  const [groupRouletteRolling, setGroupRouletteRolling] = useState(false);
  const [groupRouletteCurrent, setGroupRouletteCurrent] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);

  const [rouletteVisible, setRouletteVisible] = useState(false);
  const [rouletteRolling, setRouletteRolling] = useState(false);
  const [rouletteCurrent, setRouletteCurrent] = useState<TitleItem | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const groupSpinAnim = useRef(new Animated.Value(0)).current;
  const groupSpinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const groupCycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const groupStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedLabel = useMemo(
    () => (selectedPlatforms.length ? selectedPlatforms.join(', ') : 'Todas as plataformas'),
    [selectedPlatforms]
  );

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  const groupSpinInterpolate = groupSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  function cleanupRouletteTimers() {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    if (spinLoopRef.current) {
      spinLoopRef.current.stop();
      spinLoopRef.current = null;
    }
  }

  function cleanupGroupRouletteTimers() {
    if (groupCycleTimerRef.current) {
      clearInterval(groupCycleTimerRef.current);
      groupCycleTimerRef.current = null;
    }

    if (groupStopTimerRef.current) {
      clearTimeout(groupStopTimerRef.current);
      groupStopTimerRef.current = null;
    }

    if (groupSpinLoopRef.current) {
      groupSpinLoopRef.current.stop();
      groupSpinLoopRef.current = null;
    }
  }

  useEffect(() => {
    const onShow = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardInset(Math.max(0, event.endCoordinates?.height || 0));
    });
    const onHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardInset(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
      cleanupRouletteTimers();
      cleanupGroupRouletteTimers();
    };
  }, []);

  function startRoulette(pool: TitleItem[]) {
    if (!pool.length) return;

    cleanupRouletteTimers();
    setRouletteVisible(true);
    setRouletteRolling(true);

    const first = pickRandom(pool) || pool[0];
    setRouletteCurrent(first);

    spinAnim.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    spinLoopRef.current.start();

    cycleTimerRef.current = setInterval(() => {
      const next = pickRandom(pool);
      if (next) {
        setRouletteCurrent(next);
      }
    }, 85);

    stopTimerRef.current = setTimeout(() => {
      cleanupRouletteTimers();
      const finalPick = pickRandom(pool);
      setRouletteCurrent(finalPick);
      setPickedTitle(finalPick);
      setRouletteRolling(false);
    }, 2600);
  }

  function startGroupRoulette(pool: string[]) {
    if (!pool.length) return;

    cleanupGroupRouletteTimers();
    setGroupRouletteVisible(true);
    setGroupRouletteRolling(true);

    const first = pickRandom(pool) || pool[0];
    setGroupRouletteCurrent(first);

    groupSpinAnim.setValue(0);
    groupSpinLoopRef.current = Animated.loop(
      Animated.timing(groupSpinAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    groupSpinLoopRef.current.start();

    groupCycleTimerRef.current = setInterval(() => {
      const next = pickRandom(pool);
      if (next) {
        setGroupRouletteCurrent(next);
      }
    }, 95);

    groupStopTimerRef.current = setTimeout(() => {
      cleanupGroupRouletteTimers();
      const finalPick = pickRandom(pool) || '';
      setGroupRouletteCurrent(finalPick);
      setGroupResult(finalPick);
      setGroupRouletteRolling(false);
    }, 2500);
  }

  async function handleRandomPick() {
    setLoading(true);

    try {
      const byGenre = await searchTitles(genre.query);
      let pool = filterBySelectedPlatforms(Array.isArray(byGenre) ? byGenre : [], selectedPlatforms);

      if (randomType !== 'all') {
        pool = pool.filter((item) => item.type === randomType);
      }

      if (!pool.length) {
        const trending = await fetchTrending();
        pool = filterBySelectedPlatforms(Array.isArray(trending) ? trending : [], selectedPlatforms);
        if (randomType !== 'all') {
          pool = pool.filter((item) => item.type === randomType);
        }
      }

      startRoulette(pool.slice(0, 80));
    } finally {
      setLoading(false);
    }
  }

  function addGroupItem() {
    const value = groupInput.trim();
    if (!value) return;
    setGroupList((prev) => {
      if (prev.includes(value)) return prev;
      return [...prev, value].slice(0, 20);
    });
    setGroupInput('');
  }

  function removeGroupItem(value: string) {
    setGroupList((prev) => prev.filter((item) => item !== value));
  }

  function drawGroup() {
    if (!groupList.length) return;
    startGroupRoulette(groupList);
  }

  return (
    <>
      <View style={styles.keyboardRoot}>
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: 36 + keyboardInset }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
          <View style={styles.heroGlowBlue} />
          <View style={styles.heroGlowGold} />
          <Text style={styles.title}>Escolha Aleatoria</Text>
          <Text style={styles.heroSubtitle}>Decida em segundos quando bate a indecisao.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Surpreenda-me</Text>
          <Text style={styles.hint}>Plataformas ativas: {selectedLabel}</Text>

          <Text style={styles.label}>Genero</Text>
          <View style={styles.chipsRow}>
            {GENRES.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.chip, genre.id === item.id && styles.chipActive]}
                onPress={() => setGenre(item)}
              >
                <Text style={[styles.chipText, genre.id === item.id && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.chipsRow}>
            {['filme', 'serie', 'all'].map((item) => (
              <Pressable
                key={item}
                style={[styles.chip, randomType === item && styles.chipActive]}
                onPress={() => setRandomType(item as 'filme' | 'serie' | 'all')}
              >
                <Text style={[styles.chipText, randomType === item && styles.chipTextActive]}>
                  {item === 'all' ? 'Todos' : item.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.primaryBtn} onPress={handleRandomPick}>
            <Text style={styles.primaryBtnText}>Sortear agora</Text>
          </Pressable>

          {loading && <ActivityIndicator color="#F3D06B" style={{ marginTop: 12 }} />}

          {!!pickedTitle && (
            <View style={styles.lastPickBox}>
              <Text style={styles.lastPickLabel}>Ultimo sorteado:</Text>
              <Text numberOfLines={1} style={styles.lastPickText}>{pickedTitle.title}</Text>
            </View>
          )}
        </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sorteio em grupo</Text>
            <Text style={styles.hint}>Cada amigo adiciona uma opcao e o app decide.</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ex: La La Land"
                placeholderTextColor="#97A3BA"
                value={groupInput}
                onChangeText={setGroupInput}
                onSubmitEditing={addGroupItem}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 220);
                }}
              />
              <Pressable style={styles.addBtn} onPress={addGroupItem}>
                <Text style={styles.addBtnText}>Adicionar</Text>
              </Pressable>
            </View>

            <View style={styles.groupList}>
              {groupList.map((item) => (
                <Pressable key={item} style={styles.groupItem} onPress={() => removeGroupItem(item)}>
                  <Text style={styles.groupItemText}>{item}</Text>
                  <Text style={styles.removeText}>x</Text>
                </Pressable>
              ))}
              {!groupList.length && <Text style={styles.hint}>Nenhum titulo adicionado.</Text>}
            </View>

            <Pressable style={[styles.primaryBtn, styles.groupBtn]} onPress={drawGroup}>
              <Text style={styles.primaryBtnText}>Sortear da lista</Text>
            </Pressable>

            {!!groupResult && (
              <View style={styles.groupResultBox}>
                <Text style={styles.groupResultLabel}>Escolhido:</Text>
                <Text style={styles.groupResultText}>{groupResult}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal visible={rouletteVisible} transparent animationType="fade" onRequestClose={() => setRouletteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{rouletteRolling ? 'Sorteando...' : 'Temos um escolhido!'}</Text>

            <View style={styles.rouletteStage}>
              <Animated.View
                style={[
                  styles.rouletteRing,
                  {
                    transform: [{ rotate: spinInterpolate }]
                  }
                ]}
              />
              {!!rouletteCurrent?.poster && <Image source={{ uri: rouletteCurrent.poster }} style={styles.roulettePoster} />}
              {!rouletteCurrent?.poster && <View style={[styles.roulettePoster, styles.posterPlaceholder]} />}
            </View>

            {!!rouletteCurrent && (
              <View style={styles.modalInfo}>
                <Text numberOfLines={2} style={styles.modalPickedTitle}>{rouletteCurrent.title}</Text>
                <Text numberOfLines={1} style={styles.modalPickedMeta}>
                  {rouletteCurrent.type.toUpperCase()} • {(rouletteCurrent.availableOn || []).join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              {!rouletteRolling && !!rouletteCurrent && (
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setRouletteVisible(false);
                    navigation.navigate('Details', { id: rouletteCurrent.id, mediaType: rouletteCurrent.mediaType });
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Ver detalhes</Text>
                </Pressable>
              )}

              <Pressable style={styles.modalSecondaryBtn} onPress={() => setRouletteVisible(false)}>
                <Text style={styles.modalSecondaryBtnText}>{rouletteRolling ? 'Cancelar' : 'Fechar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={groupRouletteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          cleanupGroupRouletteTimers();
          setGroupRouletteRolling(false);
          setGroupRouletteVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{groupRouletteRolling ? 'Sorteando nomes...' : 'Nome escolhido!'}</Text>

            <View style={styles.rouletteStage}>
              <Animated.View
                style={[
                  styles.rouletteRing,
                  {
                    transform: [{ rotate: groupSpinInterpolate }]
                  }
                ]}
              />
              <View style={styles.groupRouletteNameBox}>
                <Text numberOfLines={2} style={styles.groupRouletteName}>
                  {groupRouletteCurrent || '---'}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  cleanupGroupRouletteTimers();
                  setGroupRouletteRolling(false);
                  setGroupRouletteVisible(false);
                }}
              >
                <Text style={styles.modalSecondaryBtnText}>{groupRouletteRolling ? 'Cancelar' : 'Fechar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: '#06070D'
  },
  container: {
    flex: 1,
    backgroundColor: '#06070D'
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 36
  },
  hero: {
    backgroundColor: '#0F1320',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A3550'
  },
  heroGlowBlue: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: '#2F4D9A',
    opacity: 0.22,
    top: -80,
    right: -40
  },
  heroGlowGold: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 80,
    backgroundColor: '#C89F45',
    opacity: 0.18,
    bottom: -60,
    left: -20
  },
  title: {
    color: '#F4F7FF',
    fontSize: 30,
    fontWeight: '900'
  },
  heroSubtitle: {
    color: '#B4C0D9',
    marginTop: 6,
    fontSize: 14
  },
  card: {
    backgroundColor: '#0E1424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#273552',
    padding: 12,
    marginBottom: 14
  },
  cardTitle: {
    color: '#EAF0FF',
    fontWeight: '900',
    fontSize: 18
  },
  hint: {
    color: '#9BA9C6',
    marginTop: 4
  },
  label: {
    color: '#DCE6FA',
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '800'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chip: {
    backgroundColor: '#1A2337',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D3B59'
  },
  chipActive: {
    backgroundColor: '#F3D06B',
    borderColor: '#F3D06B'
  },
  chipText: {
    color: '#DDE6FB',
    fontWeight: '700',
    fontSize: 12
  },
  chipTextActive: {
    color: '#232323'
  },
  primaryBtn: {
    backgroundColor: '#6D5BFF',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#8D82FF'
  },
  groupBtn: {
    backgroundColor: '#3D4FA6',
    borderColor: '#5B70D5'
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  lastPickBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#111A2F',
    borderWidth: 1,
    borderColor: '#445A93'
  },
  lastPickLabel: {
    color: '#A7B6D6',
    fontSize: 12
  },
  lastPickText: {
    color: '#F3D06B',
    fontWeight: '800',
    marginTop: 2
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 10
  },
  input: {
    flex: 1,
    backgroundColor: '#0A1020',
    borderWidth: 1,
    borderColor: '#2F3E63',
    borderRadius: 10,
    color: '#E7ECF6',
    paddingHorizontal: 10,
    height: 44
  },
  addBtn: {
    marginLeft: 8,
    backgroundColor: '#243654',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3D5584'
  },
  addBtnText: {
    color: '#EAF0FF',
    fontWeight: '800'
  },
  groupList: {
    marginTop: 10
  },
  groupItem: {
    backgroundColor: '#0A1020',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2E3E64'
  },
  groupItemText: {
    color: '#E7ECF6',
    flex: 1,
    marginRight: 8
  },
  removeText: {
    color: '#A5B2CF',
    fontWeight: '900'
  },
  groupResultBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#111A2F',
    borderWidth: 1,
    borderColor: '#445A93'
  },
  groupResultLabel: {
    color: '#A7B6D6',
    fontSize: 12
  },
  groupResultText: {
    color: '#F3D06B',
    fontWeight: '900',
    marginTop: 2,
    fontSize: 18
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 10, 0.86)',
    justifyContent: 'center',
    padding: 18
  },
  modalCard: {
    backgroundColor: '#0E1424',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3A4C78',
    padding: 16
  },
  modalTitle: {
    color: '#F2F6FF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  rouletteStage: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rouletteRing: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 3,
    borderColor: '#F3D06B',
    borderTopColor: '#6D5BFF',
    borderRightColor: '#8AA9FF'
  },
  roulettePoster: {
    width: 132,
    height: 188,
    borderRadius: 10,
    backgroundColor: '#1A2337'
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalInfo: {
    marginTop: 14,
    alignItems: 'center'
  },
  modalPickedTitle: {
    color: '#F1F5FF',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center'
  },
  modalPickedMeta: {
    color: '#A9B7D2',
    marginTop: 4,
    textAlign: 'center'
  },
  modalActions: {
    marginTop: 16
  },
  modalPrimaryBtn: {
    backgroundColor: '#6D5BFF',
    borderWidth: 1,
    borderColor: '#8D82FF',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  modalSecondaryBtn: {
    backgroundColor: '#1B2740',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 11
  },
  modalSecondaryBtnText: {
    color: '#DCE6FA',
    fontWeight: '800'
  },
  groupRouletteNameBox: {
    width: 200,
    minHeight: 96,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#111A2F',
    borderWidth: 1,
    borderColor: '#445A93',
    alignItems: 'center',
    justifyContent: 'center'
  },
  groupRouletteName: {
    color: '#F3D06B',
    fontWeight: '900',
    fontSize: 22,
    textAlign: 'center'
  }
});
