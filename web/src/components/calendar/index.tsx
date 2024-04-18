import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "./style.css";
import "react-datepicker/dist/react-datepicker.css";

// CSS Modules, react-datepicker-cssmodules.css
import "react-datepicker/dist/react-datepicker-cssmodules.css";

interface Props {
  startDate?: Date;
  onChange: (date: Date) => void;
}
const CalendarComponent = ({ ...props }: Props) => {
  const [startDate, setStartDate] = useState<Date>(new Date());

  useEffect(() => {
    if (props.startDate) {
      setStartDate(props.startDate);
    }
  }, [props.startDate]);
  return (
    <DatePicker
      selected={startDate}
      onChange={(date) => {
        if (date) {
          !props.startDate ? setStartDate(date) : props.onChange(date);
        }
      }}
      dateFormat={"dd/MM/yyyy"}
      popperPlacement="bottom-start"
    />
  );
};

export default CalendarComponent;
