import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface ColorSwatchProps {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorSwatch({ colors, selectedColor, onSelect }: ColorSwatchProps) {
  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {colors.map((color) => {
        const isSelected = color === selectedColor;
        return (
          <motion.button
            key={color}
            onClick={() => onSelect(color)}
            className={`relative w-7 h-7 rounded-full border-2 transition-all ${
              isSelected
                ? 'border-theme-text shadow-lg'
                : 'border-transparent hover:border-theme-text/50'
            }`}
            style={{ backgroundColor: color }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={color}
          >
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-theme-text drop-shadow-md" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
