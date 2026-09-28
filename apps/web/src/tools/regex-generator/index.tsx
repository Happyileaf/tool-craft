import { useState, useEffect } from 'react';
import { ToolComponentProps } from '../constants';
import { COMMON_PATTERNS, RegexPattern } from './utils/generator';
import { DEFAULT_PATTERN } from './constants';

import styles from './index.module.scss';

export default function RegexGenerator({ defaultInput }: ToolComponentProps) {
  const [pattern, setPattern] = useState(defaultInput || DEFAULT_PATTERN);
  const [flags, setFlags] = useState('g');
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState(
    'Contact us at support@example.com or sales@company.org.uk\nVisit us at https://example.com\nCall: 13812345678',
  );
  const [matches, setMatches] = useState<RegExpExecArray[]>([]);

  const categories = Array.from(new Set(COMMON_PATTERNS.map(p => p.category)));
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  useEffect(() => {
    try {
      setError(null);
      const filteredPattern = pattern.trim().startsWith('//') ? '' : pattern.trim();
      if (!filteredPattern) {
        setMatches([]);
        return;
      }

      // Check if pattern is a named pattern
      let actualPattern = filteredPattern;
      const found = COMMON_PATTERNS.find(
        p => p.name.toLowerCase().includes(filteredPattern.toLowerCase()) ||
             filteredPattern.toLowerCase().includes(p.name.toLowerCase()),
      );
      if (found) {
        actualPattern = found.pattern;
      }

      const regex = new RegExp(actualPattern, flags);
      const foundMatches: RegExpExecArray[] = [];
      let match;
      while ((match = regex.exec(testText)) !== null) {
        foundMatches.push(match);
        if (!flags.includes('g')) break;
      }
      setMatches(foundMatches);
    } catch (e) {
      setError((e as Error).message);
      setMatches([]);
    }
  }, [pattern, flags, testText]);

  function insertPattern(p: RegexPattern) {
    setPattern(p.pattern);
  }

  function toggleFlag(flag: string) {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  }

  const getHighlightedTestText = () => {
    if (matches.length === 0 || error) {
      return testText;
    }
    // Simple HTML highlighting for display
    let result = testText;
    // Sort matches by start position in reverse to keep indices correct
    const sortedMatches = [...matches].sort((a, b) => b.index - a.index);
    sortedMatches.forEach(match => {
      const before = result.slice(0, match.index);
      const matchText = match[0];
      const after = result.slice(match.index + matchText.length);
      result = `${before}<mark>${matchText}</mark>${after}`;
    });
    return result;
  };

  const currentRegex = () => {
    const filteredPattern = pattern.trim().startsWith('//') ? '' : pattern.trim();
    if (!filteredPattern) return '';
    const found = COMMON_PATTERNS.find(
      p => p.name.toLowerCase().includes(filteredPattern.toLowerCase()) ||
           filteredPattern.toLowerCase().includes(p.name.toLowerCase()),
    );
    return found ? found.pattern : filteredPattern;
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.categories}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className={styles.patternList}>
          {COMMON_PATTERNS.filter(p => p.category === activeCategory).map(p => (
            <div
              key={p.name}
              className={styles.patternItem}
              onClick={() => insertPattern(p)}
              title={p.description}
            >
              <div className={styles.patternName}>{p.name}</div>
              <div className={styles.patternDesc}>{p.description}</div>
              <code className={styles.patternCode}>{p.pattern}</code>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainArea}>
        <div className={styles.patternInputArea}>
          <label className={styles.label}>正则表达式</label>
          <textarea
            className={styles.textarea}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式或输入名称从列表选择"
            rows={3}
          />
          <div className={styles.flags}>
            <span className={styles.flagsLabel}>Flags:</span>
            {['g', 'i', 'm', 's', 'u'].map(flag => (
              <label key={flag} className={styles.flagLabel}>
                <input
                  type="checkbox"
                  checked={flags.includes(flag)}
                  onChange={() => toggleFlag(flag)}
                />
                {flag}
              </label>
            ))}
          </div>
          {error && <div className={styles.error}>错误: {error}</div>}
          {pattern && !error && (
            <div className={styles.resultPattern}>
              <span>生成结果: </span>
              <code>/{currentRegex()}/{flags}</code>
            </div>
          )}
        </div>

        <div className={styles.testArea}>
          <label className={styles.label}>测试文本</label>
          <textarea
            className={styles.textarea}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="在此输入测试文本"
            rows={6}
          />
        </div>

        <div className={styles.resultArea}>
          <label className={styles.label}>匹配结果 ({matches.length})</label>
          <div
            className={styles.highlightedOutput}
            dangerouslySetInnerHTML={{ __html: getHighlightedTestText() }}
          />
          {matches.length > 0 && (
            <div className={styles.matchesList}>
              {matches.map((match, idx) => (
                <div key={idx} className={styles.matchItem}>
                  <span className={styles.matchIndex}>#{idx + 1}</span>
                  <span className={styles.matchText}>匹配: "{match[0]}"</span>
                  {match.length > 1 && (
                    <span className={styles.groups}>分组: {match.slice(1).map((g, i) => `$${i+1}="${g}"`).join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
