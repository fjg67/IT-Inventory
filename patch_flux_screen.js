const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'Mouvements', 'MouvementsListScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Animated.SectionList if not present
if (!content.includes('const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);')) {
  content = content.replace(
    '// ==================== MAIN SCREEN ====================',
    '// ==================== MAIN SCREEN ====================\nconst AnimatedSectionList = Animated.createAnimatedComponent(SectionList);'
  );
}

// 2. Add scroll handler and shared value
if (!content.includes('const scrollY = useSharedValue(0);')) {
  content = content.replace(
    '  const [refreshing, setRefreshing] = useState(false);',
    '  const [refreshing, setRefreshing] = useState(false);\n  const scrollY = useSharedValue(0);\n  const onScroll = useAnimatedScrollHandler((event) => {\n    scrollY.value = event.contentOffset.y;\n  });'
  );
}

// 3. Replace <SectionList with <AnimatedSectionList onScroll={onScroll} scrollEventThrottle={16}
content = content.replace(/<SectionList/g, '<AnimatedSectionList onScroll={onScroll} scrollEventThrottle={16}');
content = content.replace(/<\/SectionList>/g, '</AnimatedSectionList>');

// 4. Transform ListHeaderComponent into a sticky-like Animated View? 
// Actually, extracting ListHeaderComponent is complex.
// Instead, let's wrap the Header content in Animated.View inside ListHeaderComponent
if (!content.includes('headerAnimatedStyle')) {
  content = content.replace(
    '  const [refreshing, setRefreshing] = useState(false);',
    `  const [refreshing, setRefreshing] = useState(false);
  
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 150], [1, 0], 'clamp'),
      transform: [
        { translateY: interpolate(scrollY.value, [0, 150], [0, -50], 'clamp') },
        { scale: interpolate(scrollY.value, [0, 150], [1, 0.95], 'clamp') }
      ]
    };
  });`
  );

  // Wrap the ListHeaderComponent's CAMouvementsHeader and Chart inside the animated view
  content = content.replace(
    '<View style={{ gap: 14, paddingTop: 0, paddingBottom: 10 }}>',
    '<Animated.View style={[{ gap: 14, paddingTop: 0, paddingBottom: 10 }, headerAnimatedStyle]}>'
  );
  content = content.replace(
    '          </View>\n        }\n        ListEmptyComponent=',
    '          </Animated.View>\n        }\n        ListEmptyComponent='
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('MouvementsListScreen.tsx patched with Collapsible Header!');
