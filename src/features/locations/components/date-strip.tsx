import { Chip, ChipGroup } from '@/components/ui/chip';
import { shortDateLabel, type LocalDate } from '@/lib/time';

type DateStripProps = {
  readonly dates: readonly LocalDate[];
  readonly selected: LocalDate;
  readonly onSelect: (date: LocalDate) => void;
};

export function DateStrip({ dates, selected, onSelect }: DateStripProps) {
  return (
    <ChipGroup>
      {dates.map((date, index) => (
        <Chip
          key={date}
          label={index === 0 ? `Today · ${shortDateLabel(date).slice(4)}` : shortDateLabel(date)}
          selected={date === selected}
          onPress={() => onSelect(date)}
        />
      ))}
    </ChipGroup>
  );
}
