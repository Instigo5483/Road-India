import { Component } from 'react'

// Optional sections cannot take the report button down with a failed chunk.
export default class HomeSectionBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError?.() }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
