#!/bin/bash
# Runs once as a one-shot container after `kafka` is healthy. Topics are
# provisioned explicitly here rather than left to auto-creation on first
# produce/consume, for two reasons found the hard way (see README):
#   1. Auto-created topics get Kafka's defaults -- `listing.snapshot.v1`
#      would silently NOT be compacted, breaking the whole point of that
#      topic (tombstones stop meaning anything without compaction).
#   2. A consumer that subscribes before a topic exists yet doesn't
#      reliably notice it appearing later without a restart -- every
#      service should be able to start in any order.
set -euo pipefail

BIN=/opt/kafka/bin
BOOTSTRAP=kafka:9094

create_topic() {
  local name="$1"
  shift
  "$BIN/kafka-topics.sh" --bootstrap-server "$BOOTSTRAP" --create --if-not-exists \
    --topic "$name" --partitions 3 --replication-factor 1 "$@"
}

create_topic listing.events.v1 --config retention.ms=604800000
create_topic listing.snapshot.v1 --config cleanup.policy=compact
create_topic media.events.v1 --config retention.ms=604800000
create_topic moderation.decisions.v1 --config retention.ms=2592000000
create_topic engagement.events.v1 --config retention.ms=86400000
create_topic notification.requests.v1 --config retention.ms=604800000

# media's retry ladder: short-lived working topics, plus a DLQ that's kept
# much longer since it's where a human eventually has to look.
create_topic media.events.v1.retry.10s --config retention.ms=86400000
create_topic media.events.v1.retry.1m --config retention.ms=86400000
create_topic media.events.v1.dlq --config retention.ms=2592000000

"$BIN/kafka-topics.sh" --bootstrap-server "$BOOTSTRAP" --list
