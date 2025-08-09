import React from 'react';
import styled from 'styled-components';

const InlineLoader = ({ color = "#4338CA", size = "100px", speed = "1.4s", bgOpacity = 0.1, className = "" }) => {
  return (
    <StyledContainer
      className={className}
      style={{
        "--uib-size": size,
        "--uib-color": color,
        "--uib-speed": speed,
        "--uib-bg-opacity": bgOpacity
      }}
      viewBox="0 0 40 40"
      height={size}
      width={size}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        className="track"
        fill="none"
        strokeWidth="4"
        pathLength="100"
        d="M29.760000000000005 18.72 c0 7.28 -3.9200000000000004 13.600000000000001 -9.840000000000002 16.96 c-2.8800000000000003 1.6800000000000002 -6.24 2.64 -9.840000000000002 2.64 c-3.6 0 -6.88 -0.96 -9.76 -2.64 c0 -7.28 3.9200000000000004 -13.52 9.840000000000002 -16.96 c2.8800000000000003 -1.6800000000000002 6.24 -2.64 9.76 -2.64 S26.880000000000003 17.040000000000003 29.760000000000005 18.72 c5.84 3.3600000000000003 9.76 9.68 9.840000000000002 16.96 c-2.8800000000000003 1.6800000000000002 -6.24 2.64 -9.76 2.64 c-3.6 0 -6.88 -0.96 -9.840000000000002 -2.64 c-5.84 -3.3600000000000003 -9.76 -9.68 -9.76 -16.96 c0 -7.28 3.9200000000000004 -13.600000000000001 9.76 -16.96 C25.84 5.120000000000001 29.760000000000005 11.440000000000001 29.760000000000005 18.72z"
      ></path>
      <path
        className="car"
        fill="none"
        strokeWidth="4"
        pathLength="100"
        d="M29.760000000000005 18.72 c0 7.28 -3.9200000000000004 13.600000000000001 -9.840000000000002 16.96 c-2.8800000000000003 1.6800000000000002 -6.24 2.64 -9.840000000000002 2.64 c-3.6 0 -6.88 -0.96 -9.76 -2.64 c0 -7.28 3.9200000000000004 -13.52 9.840000000000002 -16.96 c2.8800000000000003 -1.6800000000000002 6.24 -2.64 9.76 -2.64 S26.880000000000003 17.040000000000003 29.760000000000005 18.72 c5.84 3.3600000000000003 9.76 9.68 9.840000000000002 16.96 c-2.8800000000000003 1.6800000000000002 -6.24 2.64 -9.76 2.64 c-3.6 0 -6.88 -0.96 -9.840000000000002 -2.64 c-5.84 -3.3600000000000003 -9.76 -9.68 -9.76 -16.96 c0 -7.28 3.9200000000000004 -13.600000000000001 9.76 -16.96 C25.84 5.120000000000001 29.760000000000005 11.440000000000001 29.760000000000005 18.72z"
      ></path>
    </StyledContainer>
  );
}

const StyledContainer = styled.svg`
  --uib-size: 40px;
  --uib-speed: 1.4s;
  --uib-bg-opacity: .1;
  height: var(--uib-size);
  width: var(--uib-size);
  transform-origin: center;
  overflow: visible;

  .car {
    fill: none;
    stroke: var(--uib-color);
    stroke-dasharray: 15, 85;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: travel var(--uib-speed) linear infinite;
    will-change: stroke-dasharray, stroke-dashoffset;
    transition: stroke 0.5s ease;
  }

  .track {
    stroke: var(--uib-color);
    opacity: var(--uib-bg-opacity);
    transition: stroke 0.5s ease;
  }

  @keyframes travel {
    0% {
      stroke-dashoffset: 0;
    }

    100% {
      stroke-dashoffset: -100;
    }
  }
`;

export default InlineLoader;
