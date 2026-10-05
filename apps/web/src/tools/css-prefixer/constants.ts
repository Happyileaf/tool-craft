export const DEFAULT_SAMPLE_CSS = `/*
Example CSS that needs vendor prefixes
*/
::placeholder {
  color: gray;
}

.user-card {
  display: grid;
  transition: all 0.3s ease;
  user-select: none;
  backdrop-filter: blur(10px);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.container {
  display: flex;
  gap: 1rem;
}
`;
