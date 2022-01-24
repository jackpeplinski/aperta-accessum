import * as React from "react";
import Slider from "@mui/material/Slider";
import { alpha, styled } from "@mui/material/styles";
import { TextField } from "@mui/material";

const TextFieldStyled = styled(TextField)(({ theme }) => ({
  width: 300,
  color: theme.palette.secondary.main,
  outlineColor: theme.palette.secondary.main,

  cssLabel: {
    color : 'green'
  },

  cssOutlinedInput: {
    '&$cssFocused $notchedOutline': {
      borderColor: `${theme.palette.primary.main} !important`,
    }
  },

  cssFocused: {},

  notchedOutline: {
    borderWidth: '1px',
    borderColor: 'green !important'
  },
}));

export default function StyledTextField() {
  return <TextFieldStyled id="outlined-basic" label="Outlined" variant="outlined"/>;
}
