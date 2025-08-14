// mainly using for ctrl+s to save but can add more later
import { useEffect } from 'react';

function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyPress = (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      
      shortcuts.forEach(shortcut => {
        const matchesKey = shortcut.key.toLowerCase() === key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? (ctrlKey || metaKey) : true;
        const matchesShift = shortcut.shiftKey ? shiftKey : !shiftKey;
        const matchesAlt = shortcut.altKey ? altKey : !altKey;
        
        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [shortcuts]);
}

export default useKeyboardShortcuts;
