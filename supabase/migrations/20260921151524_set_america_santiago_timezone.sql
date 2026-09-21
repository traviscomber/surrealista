-- Keep timestamp values canonical while making database sessions use Chilean civil time.
ALTER DATABASE postgres SET timezone TO 'America/Santiago';
