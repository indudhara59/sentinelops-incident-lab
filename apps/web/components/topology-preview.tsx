"use client";

import { motion, useReducedMotion } from "framer-motion";

const nodes = [
  { id: "gateway", label: "API gateway", status: "healthy", x: 40, y: 47 },
  { id: "catalog", label: "Catalog", status: "healthy", x: 192, y: 18 },
  { id: "order", label: "Order service", status: "degraded", x: 192, y: 93 },
  { id: "payment", label: "Payment", status: "healthy", x: 360, y: 18 },
  { id: "database", label: "Orders DB", status: "critical", x: 360, y: 93 },
] as const;

export function TopologyPreview() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className="topology"
      aria-label="Simulated service topology showing a degraded order service"
    >
      <div className="panel-heading">
        <span>
          <i className="status-dot critical" /> ACTIVE INCIDENT
        </span>
        <span className="mono">INC-0042 · 00:18:37</span>
      </div>
      <div className="topology-canvas">
        <svg
          aria-hidden="true"
          viewBox="0 0 460 150"
          preserveAspectRatio="none"
        >
          <path d="M105 70 L192 40 M105 70 L192 115 M270 40 L360 40 M285 115 L360 115" />
          <motion.path
            className="signal-path"
            d="M285 115 L360 115"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 1.4,
              repeat: reduceMotion ? 0 : Infinity,
              repeatType: "reverse",
            }}
          />
        </svg>
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            className={`service-node ${node.status}`}
            style={{ left: node.x, top: node.y }}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <span className="node-icon">
              {node.label.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{node.label}</strong>
              <small>{node.status}</small>
            </span>
          </motion.div>
        ))}
      </div>
      <div className="metric-strip">
        <div>
          <span>CHECKOUT P95</span>
          <strong>
            2.84s <small>↑ 312%</small>
          </strong>
        </div>
        <svg
          viewBox="0 0 250 45"
          role="img"
          aria-label="Latency rose sharply and remains elevated"
        >
          <path
            className="metric-fill"
            d="M0 41 L0 35 L30 34 L55 37 L80 30 L100 32 L120 11 L145 18 L165 8 L185 13 L205 6 L225 10 L250 4 L250 45 Z"
          />
          <motion.path
            className="metric-line"
            d="M0 35 L30 34 L55 37 L80 30 L100 32 L120 11 L145 18 L165 8 L185 13 L205 6 L225 10 L250 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.7 }}
          />
        </svg>
      </div>
      <div className="log-line mono">
        <span>18:42:16.902</span> <b>ERROR</b> order-service · db pool timeout
        after 5000ms
      </div>
    </div>
  );
}
